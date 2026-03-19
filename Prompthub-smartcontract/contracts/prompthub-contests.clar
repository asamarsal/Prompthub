;; prompthub-contests.clar
;; Multi-winner escrow for PromptHub contests.
;; The brand sets prize tiers (1st, 2nd, 3rd) at creation time.
;; When ALL tier winners are declared, the contract auto-releases the funds.

(use-trait sip-010-trait .sip-010-trait-ft-standard.sip-010-trait)

;; =====================
;; Constants & Errors
;; =====================

;; FIX: Use data-var so admin is transferable
(define-data-var platform-admin principal tx-sender)
(define-constant platform-fee-percent u25) ;; 2.5% = 25 / 1000

(define-constant err-not-authorized (err u100))
(define-constant err-contest-not-found (err u101))
(define-constant err-invalid-status (err u102))
(define-constant err-no-submission (err u103))
(define-constant err-tier-not-found (err u104))
(define-constant err-already-has-winner (err u105))
(define-constant err-invalid-currency (err u106))
(define-constant err-invalid-amount (err u107))
;; FIX: New error for tier sum mismatch
(define-constant err-tier-sum-mismatch (err u108))
;; FIX: New error for deadline in the past
(define-constant err-invalid-deadline (err u109))

;; =====================
;; Data Storage
;; =====================
(define-data-var next-contest-id uint u1)

(define-map contests
  uint
  {
    brand: principal,
    total-pool: uint,
    ;; FIX: Track remaining-pool separately so cancel-contest refunds correctly
    ;; after some winners have already been paid out
    remaining-pool: uint,
    num-tiers: uint,
    winners-declared: uint,
    deadline: uint,
    status: (string-ascii 20), ;; "OPEN", "COMPLETED", "CANCELLED"
    currency-type: (string-ascii 10),
    token-contract: principal,
  }
)

;; Prize tiers keyed by contest-id + place (u1 = 1st, u2 = 2nd, etc.)
(define-map prize-tiers
  { contest-id: uint, place: uint }
  {
    amount: uint,
    winner: (optional principal),
  }
)

;; Submission registry
(define-map submissions
  { contest-id: uint, artist: principal }
  { entry-id: (string-ascii 64) }
)

;; =====================
;; Read-Only Helpers
;; =====================
(define-read-only (get-contest (contest-id uint))
  (map-get? contests contest-id)
)

(define-read-only (get-prize-tier (contest-id uint) (place uint))
  (map-get? prize-tiers { contest-id: contest-id, place: place })
)

(define-read-only (has-submitted (contest-id uint) (artist principal))
  (is-some (map-get? submissions { contest-id: contest-id, artist: artist }))
)

(define-read-only (get-all-winners (contest-id uint))
  {
    place-1: (map-get? prize-tiers { contest-id: contest-id, place: u1 }),
    place-2: (map-get? prize-tiers { contest-id: contest-id, place: u2 }),
    place-3: (map-get? prize-tiers { contest-id: contest-id, place: u3 }),
    place-4: (map-get? prize-tiers { contest-id: contest-id, place: u4 }),
    place-5: (map-get? prize-tiers { contest-id: contest-id, place: u5 }),
  }
)

(define-read-only (get-admin)
  (ok (var-get platform-admin))
)

;; =====================
;; Fund Contest (Create + Deposit Escrow)
;; =====================
(define-public (fund-contest
    (total-pool uint)
    (num-tiers uint)
    (tier-1 uint)
    (tier-2 uint)
    (tier-3 uint)
    (tier-4 uint)
    (tier-5 uint)
    (deadline uint)
    (currency-type (string-ascii 10))
    (sbtc-contract <sip-010-trait>)
  )
  (let (
      (contest-id (var-get next-contest-id))
      ;; FIX: Compute sum of all tiers to verify it matches total-pool
      (tier-sum (+ tier-1 (+ tier-2 (+ tier-3 (+ tier-4 tier-5)))))
    )
    (asserts! (> total-pool u0) err-invalid-amount)
    (asserts! (> num-tiers u0) err-invalid-amount)
    (asserts! (<= num-tiers u5) err-invalid-amount)
    ;; FIX: Ensure tier amounts sum exactly to total-pool — prevents payout shortfall
    (asserts! (is-eq tier-sum total-pool) err-tier-sum-mismatch)
    ;; FIX: Deadline must be in the future
    (asserts! (> deadline block-height) err-invalid-deadline)
    (asserts! (or (is-eq currency-type "STX") (is-eq currency-type "sBTC")) err-invalid-currency)

    ;; Lock the full prize pool into escrow
    (if (is-eq currency-type "STX")
      (try! (stx-transfer? total-pool tx-sender (as-contract tx-sender)))
      (begin
        (asserts! (is-eq currency-type "sBTC") err-invalid-currency)
        (try! (contract-call? sbtc-contract transfer total-pool tx-sender
          (as-contract tx-sender) none
        ))
      )
    )

    ;; Store contest metadata
    (map-set contests contest-id {
      brand: tx-sender,
      total-pool: total-pool,
      remaining-pool: total-pool, ;; FIX: Initialize remaining-pool
      num-tiers: num-tiers,
      winners-declared: u0,
      deadline: deadline,
      status: "OPEN",
      currency-type: currency-type,
      token-contract: (contract-of sbtc-contract),
    })

    ;; Initialize all prize tiers (up to 5)
    (map-set prize-tiers { contest-id: contest-id, place: u1 } { amount: tier-1, winner: none })
    (map-set prize-tiers { contest-id: contest-id, place: u2 } { amount: tier-2, winner: none })
    (map-set prize-tiers { contest-id: contest-id, place: u3 } { amount: tier-3, winner: none })
    (map-set prize-tiers { contest-id: contest-id, place: u4 } { amount: tier-4, winner: none })
    (map-set prize-tiers { contest-id: contest-id, place: u5 } { amount: tier-5, winner: none })

    (var-set next-contest-id (+ contest-id u1))
    (ok contest-id)
  )
)

;; =====================
;; Submit Entry
;; =====================
(define-public (submit-entry
    (contest-id uint)
    (entry-id (string-ascii 64))
  )
  (let ((contest (unwrap! (map-get? contests contest-id) err-contest-not-found)))
    (asserts! (is-eq (get status contest) "OPEN") err-invalid-status)
    ;; FIX: Enforce deadline — cannot submit after deadline block
    (asserts! (< block-height (get deadline contest)) err-invalid-status)
    (map-set submissions
      { contest-id: contest-id, artist: tx-sender }
      { entry-id: entry-id }
    )
    (ok true)
  )
)

;; =====================
;; Declare Winner for a Tier
;; Brand calls this for EACH prize tier.
;; =====================
(define-public (declare-winner
    (contest-id uint)
    (place uint)
    (winner principal)
    (sbtc-contract <sip-010-trait>)
  )
  (let (
      (contest (unwrap! (map-get? contests contest-id) err-contest-not-found))
      (tier (unwrap!
        (map-get? prize-tiers { contest-id: contest-id, place: place })
        err-tier-not-found
      ))
      (brand (get brand contest))
      (currency-type (get currency-type contest))
      (token-addr (get token-contract contest))
      (new-winners-count (+ (get winners-declared contest) u1))
      (tier-amount (get amount tier))
      (fee (/ (* tier-amount platform-fee-percent) u1000))
      (payout (- tier-amount fee))
    )
    (asserts! (is-eq tx-sender brand) err-not-authorized)
    (asserts! (is-eq (get status contest) "OPEN") err-invalid-status)
    (asserts! (is-none (get winner tier)) err-already-has-winner)
    ;; Winner must have an on-chain submission
    (asserts! (has-submitted contest-id winner) err-no-submission)

    ;; Record winner in the tier
    (map-set prize-tiers
      { contest-id: contest-id, place: place }
      (merge tier { winner: (some winner) })
    )

    ;; Transfer this tier's prize to winner with 2.5% fee to treasury
    (if (is-eq currency-type "STX")
      (begin
        (if (> fee u0)
          (try! (as-contract (contract-call? .prompthub-treasury deposit-stx fee)))
          true
        )
        (if (> payout u0)
          (try! (as-contract (stx-transfer? payout tx-sender winner)))
          true
        )
      )
      (begin
        (asserts! (is-eq (contract-of sbtc-contract) token-addr) err-invalid-currency)
        (if (> fee u0)
          (try! (as-contract (contract-call? .prompthub-treasury deposit-sbtc fee sbtc-contract)))
          true
        )
        (if (> payout u0)
          (try! (as-contract (contract-call? sbtc-contract transfer payout tx-sender winner none)))
          true
        )
      )
    )

    ;; FIX: Reduce remaining-pool by the full tier-amount (fee + payout)
    (let ((new-remaining (- (get remaining-pool contest) tier-amount)))
      (if (>= new-winners-count (get num-tiers contest))
        (map-set contests contest-id
          (merge contest {
            winners-declared: new-winners-count,
            remaining-pool: new-remaining,
            status: "COMPLETED",
          })
        )
        (map-set contests contest-id
          (merge contest {
            winners-declared: new-winners-count,
            remaining-pool: new-remaining,
          })
        )
      )
    )
    (ok true)
  )
)

;; =====================
;; Declare Winner External (off-chain submission, no on-chain entry required)
;; =====================
(define-public (declare-winner-external
    (contest-id uint)
    (place uint)
    (winner principal)
    (sbtc-contract <sip-010-trait>)
  )
  (let (
      (contest (unwrap! (map-get? contests contest-id) err-contest-not-found))
      (tier (unwrap!
        (map-get? prize-tiers { contest-id: contest-id, place: place })
        err-tier-not-found
      ))
      (brand (get brand contest))
      (currency-type (get currency-type contest))
      (token-addr (get token-contract contest))
      (new-winners-count (+ (get winners-declared contest) u1))
      (tier-amount (get amount tier))
      (fee (/ (* tier-amount platform-fee-percent) u1000))
      (payout (- tier-amount fee))
    )
    (asserts! (is-eq tx-sender brand) err-not-authorized)
    (asserts! (is-eq (get status contest) "OPEN") err-invalid-status)
    (asserts! (is-none (get winner tier)) err-already-has-winner)
    ;; Note: No submission check — any Stacks principal accepted

    ;; Record winner in the tier
    (map-set prize-tiers
      { contest-id: contest-id, place: place }
      (merge tier { winner: (some winner) })
    )

    ;; FIX: Guard fee/payout transfers with > 0 checks (consistent with declare-winner)
    (if (is-eq currency-type "STX")
      (begin
        (if (> fee u0)
          (try! (as-contract (contract-call? .prompthub-treasury deposit-stx fee)))
          true
        )
        (if (> payout u0)
          (try! (as-contract (stx-transfer? payout tx-sender winner)))
          true
        )
      )
      (begin
        (asserts! (is-eq (contract-of sbtc-contract) token-addr) err-invalid-currency)
        (if (> fee u0)
          (try! (as-contract (contract-call? .prompthub-treasury deposit-sbtc fee sbtc-contract)))
          true
        )
        (if (> payout u0)
          (try! (as-contract (contract-call? sbtc-contract transfer payout tx-sender winner none)))
          true
        )
      )
    )

    ;; FIX: Reduce remaining-pool
    (let ((new-remaining (- (get remaining-pool contest) tier-amount)))
      (if (>= new-winners-count (get num-tiers contest))
        (map-set contests contest-id
          (merge contest {
            winners-declared: new-winners-count,
            remaining-pool: new-remaining,
            status: "COMPLETED",
          })
        )
        (map-set contests contest-id
          (merge contest {
            winners-declared: new-winners-count,
            remaining-pool: new-remaining,
          })
        )
      )
    )
    (ok true)
  )
)

;; =====================
;; Cancel Contest
;; FIX: Brand OR admin can cancel. Refunds only remaining-pool (not total-pool)
;; so already-paid prize tiers are not double-refunded.
;; =====================
(define-public (cancel-contest
    (contest-id uint)
    (sbtc-contract <sip-010-trait>)
  )
  (let (
      (contest (unwrap! (map-get? contests contest-id) err-contest-not-found))
      (brand (get brand contest))
      (currency-type (get currency-type contest))
      (token-addr (get token-contract contest))
      ;; FIX: Use remaining-pool, not total-pool
      (refund-amount (get remaining-pool contest))
    )
    ;; FIX: Brand can cancel their own contest, not just admin
    (asserts! (or (is-eq tx-sender brand) (is-eq tx-sender (var-get platform-admin)))
      err-not-authorized
    )
    (asserts! (is-eq (get status contest) "OPEN") err-invalid-status)

    ;; Refund remaining pool to brand
    (if (is-eq currency-type "STX")
      (if (> refund-amount u0)
        (try! (as-contract (stx-transfer? refund-amount tx-sender brand)))
        true
      )
      (begin
        (asserts! (is-eq (contract-of sbtc-contract) token-addr) err-invalid-currency)
        (if (> refund-amount u0)
          (try! (as-contract (contract-call? sbtc-contract transfer refund-amount tx-sender
            brand none
          )))
          true
        )
      )
    )

    (map-set contests contest-id (merge contest { status: "CANCELLED", remaining-pool: u0 }))
    (ok true)
  )
)

;; =====================
;; Expire Contest (callable by anyone after deadline)
;; FIX: Enforce deadline — allows admin or brand to reclaim funds if contest expires
;; without all winners being declared
;; =====================
(define-public (expire-contest
    (contest-id uint)
    (sbtc-contract <sip-010-trait>)
  )
  (let (
      (contest (unwrap! (map-get? contests contest-id) err-contest-not-found))
      (brand (get brand contest))
      (currency-type (get currency-type contest))
      (token-addr (get token-contract contest))
      (refund-amount (get remaining-pool contest))
    )
    (asserts! (is-eq (get status contest) "OPEN") err-invalid-status)
    ;; FIX: Deadline must have passed
    (asserts! (>= block-height (get deadline contest)) err-invalid-status)
    ;; Only brand or admin can trigger expiry
    (asserts! (or (is-eq tx-sender brand) (is-eq tx-sender (var-get platform-admin)))
      err-not-authorized
    )

    ;; Return remaining escrow to brand
    (if (is-eq currency-type "STX")
      (if (> refund-amount u0)
        (try! (as-contract (stx-transfer? refund-amount tx-sender brand)))
        true
      )
      (begin
        (asserts! (is-eq (contract-of sbtc-contract) token-addr) err-invalid-currency)
        (if (> refund-amount u0)
          (try! (as-contract (contract-call? sbtc-contract transfer refund-amount tx-sender
            brand none
          )))
          true
        )
      )
    )

    (map-set contests contest-id (merge contest { status: "CANCELLED", remaining-pool: u0 }))
    (ok true)
  )
)

;; =====================
;; Extend Deadline
;; =====================
(define-public (extend-deadline
    (contest-id uint)
    (new-deadline uint)
  )
  (let (
      (contest (unwrap! (map-get? contests contest-id) err-contest-not-found))
      (brand (get brand contest))
    )
    (asserts! (is-eq tx-sender brand) err-not-authorized)
    (asserts! (is-eq (get status contest) "OPEN") err-invalid-status)
    ;; FIX: New deadline must be strictly in the future and after current deadline
    (asserts! (> new-deadline (get deadline contest)) err-invalid-amount)
    (asserts! (> new-deadline block-height) err-invalid-deadline)

    (map-set contests contest-id (merge contest { deadline: new-deadline }))
    (ok true)
  )
)

;; =====================
;; Admin Management
;; =====================

;; FIX: Transfer admin to new principal (e.g. multisig)
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get platform-admin)) err-not-authorized)
    (ok (var-set platform-admin new-admin))
  )
)
