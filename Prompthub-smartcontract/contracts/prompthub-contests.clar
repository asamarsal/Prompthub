;; prompthub-contests.clar
;; Multi-winner escrow for PromptHub contests.
;; The brand sets prize tiers (1st, 2nd, 3rd) at creation time.
;; When ALL tier winners are declared, the contract auto-releases the funds.

(use-trait sip-010-trait .sip-010-trait-ft-standard.sip-010-trait)

;; =====================
;; Constants & Errors
;; =====================
(define-constant platform-admin tx-sender)
(define-constant platform-fee-percent u25) ;; 2.5% = 25 / 1000

(define-constant err-not-authorized (err u100))
(define-constant err-contest-not-found (err u101))
(define-constant err-invalid-status (err u102))
(define-constant err-no-submission (err u103))
(define-constant err-tier-not-found (err u104))
(define-constant err-already-has-winner (err u105))
(define-constant err-invalid-currency (err u106))
(define-constant err-invalid-amount (err u107))

;; =====================
;; Data Storage
;; =====================
(define-data-var next-contest-id uint u1)

;; Core contest meta data
(define-map contests
  uint
  {
    brand: principal,
    total-pool: uint, ;; Total STX/sBTC escrowed (sum of all tiers)
    num-tiers: uint, ;; How many prize tiers (e.g. 3 for 1st/2nd/3rd)
    winners-declared: uint, ;; How many tier winners have been declared so far
    deadline: uint, ;; Block height deadline
    status: (string-ascii 20), ;; "PENDING_FUND", "OPEN", "COMPLETED", "CANCELLED"
    currency-type: (string-ascii 10), ;; "STX" or "sBTC"
    token-contract: principal, ;; Contract used (if sBTC)
  }
)

;; Prize tiers  keyed by contest-id + place (u1 = 1st, u2 = 2nd, etc.)
(define-map prize-tiers
  {
    contest-id: uint,
    place: uint,
  }
  {
    amount: uint, ;; Prize amount in uSTX
    winner: (optional principal), ;; Filled in when brand declares winner
  }
)

;; Submission registry
(define-map submissions
  {
    contest-id: uint,
    artist: principal,
  }
  { entry-id: (string-ascii 64) }
)

;; =====================
;; Read-only Helpers
;; =====================
(define-read-only (get-contest (contest-id uint))
  (map-get? contests contest-id)
)

(define-read-only (get-prize-tier
    (contest-id uint)
    (place uint)
  )
  (map-get? prize-tiers {
    contest-id: contest-id,
    place: place,
  })
)

(define-read-only (has-submitted
    (contest-id uint)
    (artist principal)
  )
  (is-some (map-get? submissions {
    contest-id: contest-id,
    artist: artist,
  }))
)

;; Get all winners across all tiers in one call
(define-read-only (get-all-winners (contest-id uint))
  {
    place-1: (map-get? prize-tiers {
      contest-id: contest-id,
      place: u1,
    }),
    place-2: (map-get? prize-tiers {
      contest-id: contest-id,
      place: u2,
    }),
    place-3: (map-get? prize-tiers {
      contest-id: contest-id,
      place: u3,
    }),
    place-4: (map-get? prize-tiers {
      contest-id: contest-id,
      place: u4,
    }),
    place-5: (map-get? prize-tiers {
      contest-id: contest-id,
      place: u5,
    }),
  }
)
;; =====================
;; Fund Contest (Create + Deposit Escrow)
;; Brand calls this once to lock the entire prize pool.
;; Must provide: total-pool (uSTX), num-tiers (how many winners),
;;               prize amounts per tier as a list (up to 5 tiers),
;;               and a deadline (block height).
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
  (let ((contest-id (var-get next-contest-id)))
    (asserts! (> total-pool u0) err-invalid-amount)

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
      num-tiers: num-tiers,
      winners-declared: u0,
      deadline: deadline,
      status: "OPEN",
      currency-type: currency-type,
      token-contract: (contract-of sbtc-contract),
    })

    ;; Initialize all prize tiers (up to 5)
    (map-set prize-tiers {
      contest-id: contest-id,
      place: u1,
    } {
      amount: tier-1,
      winner: none,
    })
    (map-set prize-tiers {
      contest-id: contest-id,
      place: u2,
    } {
      amount: tier-2,
      winner: none,
    })
    (map-set prize-tiers {
      contest-id: contest-id,
      place: u3,
    } {
      amount: tier-3,
      winner: none,
    })
    (map-set prize-tiers {
      contest-id: contest-id,
      place: u4,
    } {
      amount: tier-4,
      winner: none,
    })
    (map-set prize-tiers {
      contest-id: contest-id,
      place: u5,
    } {
      amount: tier-5,
      winner: none,
    })

    (var-set next-contest-id (+ contest-id u1))
    (ok contest-id)
  )
)

;; =====================
;; Submit Entry
;; Artist registers their on-chain entry (entry-id is the IPFS CID hash).
;; =====================
(define-public (submit-entry
    (contest-id uint)
    (entry-id (string-ascii 64))
  )
  (let ((contest (unwrap! (map-get? contests contest-id) err-contest-not-found)))
    (asserts! (is-eq (get status contest) "OPEN") err-invalid-status)
    (map-set submissions {
      contest-id: contest-id,
      artist: tx-sender,
    } { entry-id: entry-id }
    )
    (ok true)
  )
)

;; =====================
;; Declare Winner for a Tier
;; Brand calls this for EACH prize tier. When the last winner is declared
;; (winners-declared == num-tiers), the contract auto-releases all prizes.
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
        (map-get? prize-tiers {
          contest-id: contest-id,
          place: place,
        })
        err-tier-not-found
      ))
      (brand (get brand contest))
      (currency-type (get currency-type contest))
      (token-addr (get token-contract contest))
      (new-winners-count (+ (get winners-declared contest) u1))
      (fee (/ (* (get amount tier) platform-fee-percent) u1000))
      (payout (- (get amount tier) fee))
    )
    ;; Only the brand who created the contest can declare winners
    (asserts! (is-eq tx-sender brand) err-not-authorized)
    ;; Contest must be OPEN
    (asserts! (is-eq (get status contest) "OPEN") err-invalid-status)
    ;; Tier must not have a winner yet
    (asserts! (is-none (get winner tier)) err-already-has-winner)
    ;; Winner must have a submission
    (asserts! (has-submitted contest-id winner) err-no-submission)

    ;; Record winner in the tier
    (map-set prize-tiers {
      contest-id: contest-id,
      place: place,
    }
      (merge tier { winner: (some winner) })
    )

    ;; Transfer this tier's prize immediately to the winner (with 2.5% treasury fee deduction)
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
        (asserts! (is-eq (contract-of sbtc-contract) token-addr)
          err-invalid-currency
        )
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

    ;; Check if ALL tiers have been filled  auto-complete the contest
    (if (>= new-winners-count (get num-tiers contest))
      ;; All winners declared  mark contest COMPLETED
      (map-set contests contest-id
        (merge contest {
          winners-declared: new-winners-count,
          status: "COMPLETED",
        })
      )
      ;; Not done yet  just update the count
      (map-set contests contest-id
        (merge contest { winners-declared: new-winners-count })
      )
    )
    (ok true)
  )
)

;; =====================
;; Cancel Contest (brand retrieves unused escrow)
;; Only callable if status is OPEN and no submissions yet.
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
    )
    (asserts! (is-eq tx-sender platform-admin) err-not-authorized)
    (asserts! (is-eq (get status contest) "OPEN") err-invalid-status)

    ;; Refund remaining pool to brand 100%
    (if (is-eq currency-type "STX")
      (try! (as-contract (stx-transfer? (get total-pool contest) tx-sender brand)))
      (begin
        (asserts! (is-eq (contract-of sbtc-contract) token-addr)
          err-invalid-currency
        )
        (try! (as-contract (contract-call? sbtc-contract transfer (get total-pool contest) tx-sender
          brand none
        )))
      )
    )

    (map-set contests contest-id (merge contest { status: "CANCELLED" }))
    (ok true)
  )
)

;; =====================
;; Declare Winner  External / Manual Override
;; Same as declare-winner, but NO on-chain submission required.
;; Use when the winner was chosen via off-chain submission (e.g., platform only upload).
;; Brand manually inputs ANY Stacks Principal address as the winner.
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
        (map-get? prize-tiers {
          contest-id: contest-id,
          place: place,
        })
        err-tier-not-found
      ))
      (brand (get brand contest))
      (currency-type (get currency-type contest))
      (token-addr (get token-contract contest))
      (new-winners-count (+ (get winners-declared contest) u1))
      (fee (/ (* (get amount tier) platform-fee-percent) u1000))
      (payout (- (get amount tier) fee))
    )
    ;; Only the brand can declare winners
    (asserts! (is-eq tx-sender brand) err-not-authorized)
    ;; Contest must be OPEN
    (asserts! (is-eq (get status contest) "OPEN") err-invalid-status)
    ;; Tier must not already have a winner
    (asserts! (is-none (get winner tier)) err-already-has-winner)

    ;;  Note: No submission check  any STX address accepted manually

    ;; Record winner in the tier
    (map-set prize-tiers {
      contest-id: contest-id,
      place: place,
    }
      (merge tier { winner: (some winner) })
    )

    ;; Transfer this tier's prize immediately to the winner (with 2.5% treasury fee deduction)
    (if (is-eq currency-type "STX")
      (begin
        (try! (as-contract (contract-call? .prompthub-treasury deposit-stx fee)))
        (try! (as-contract (stx-transfer? payout tx-sender winner)))
      )
      (begin
        (asserts! (is-eq (contract-of sbtc-contract) token-addr)
          err-invalid-currency
        )
        (try! (as-contract (contract-call? .prompthub-treasury deposit-sbtc fee sbtc-contract)))
        (try! (as-contract (contract-call? sbtc-contract transfer payout tx-sender winner none)))
      )
    )

    ;; Auto-complete if all tiers have been filled
    (if (>= new-winners-count (get num-tiers contest))
      (map-set contests contest-id
        (merge contest {
          winners-declared: new-winners-count,
          status: "COMPLETED",
        })
      )
      (map-set contests contest-id
        (merge contest { winners-declared: new-winners-count })
      )
    )
    (ok true)
  )
)
