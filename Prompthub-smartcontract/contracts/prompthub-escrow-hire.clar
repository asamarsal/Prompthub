;; prompthub-escrow-hire
;; Escrow contract for P2P designer hiring.

(use-trait sip-010-trait .sip-010-trait-ft-standard.sip-010-trait)

;; =====================
;; Constants & Errors
;; =====================
(define-constant err-not-authorized (err u100))
(define-constant err-job-not-found (err u101))
(define-constant err-invalid-status (err u102))
(define-constant err-invalid-currency (err u103))
(define-constant err-invalid-amount (err u104))

;; FIX: Use data-var for admin so ownership is transferable
(define-data-var platform-admin principal tx-sender)
(define-constant platform-fee-percent u25) ;; 2.5% = 25/1000

;; Dispute timeout: if client hasn't acted within this many blocks,
;; artist can trigger dispute themselves (~7 days at 10min/block)
(define-constant dispute-timeout-blocks u1008)

;; =====================
;; Data Storage
;; =====================
(define-map jobs
  uint
  {
    client: principal,
    artist: principal,
    amount: uint,
    status: (string-ascii 20), ;; "PENDING", "COMPLETED", "REFUNDED", "DISPUTED", "RESOLVED"
    currency-type: (string-ascii 10),
    token-contract: principal,
    ;; FIX: Track creation block so artist can self-dispute after timeout
    created-at-block: uint,
  }
)

(define-data-var next-job-id uint u1)

;; =====================
;; Read-Only
;; =====================
(define-read-only (get-job (job-id uint))
  (map-get? jobs job-id)
)

(define-read-only (get-admin)
  (ok (var-get platform-admin))
)

;; =====================
;; Create Job (Client deposits STX/sBTC)
;; =====================
(define-public (create-hire-job
    (artist principal)
    (amount uint)
    (currency-type (string-ascii 10))
    (sbtc-contract <sip-010-trait>)
  )
  (let ((job-id (var-get next-job-id)))
    (asserts! (> amount u0) err-invalid-amount)
    (asserts! (or (is-eq currency-type "STX") (is-eq currency-type "sBTC")) err-invalid-currency)

    ;; Lock funds into escrow
    (if (is-eq currency-type "STX")
      (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
      (begin
        (asserts! (is-eq currency-type "sBTC") err-invalid-currency)
        (try! (contract-call? sbtc-contract transfer amount tx-sender
          (as-contract tx-sender) none
        ))
      )
    )

    (map-set jobs job-id {
      client: tx-sender,
      artist: artist,
      amount: amount,
      status: "PENDING",
      currency-type: currency-type,
      token-contract: (contract-of sbtc-contract),
      created-at-block: block-height,
    })
    (var-set next-job-id (+ job-id u1))
    (ok job-id)
  )
)

;; =====================
;; Complete Job (Client approves → releases funds to artist)
;; =====================
(define-public (complete-job
    (job-id uint)
    (sbtc-contract <sip-010-trait>)
  )
  (let (
      (job (unwrap! (map-get? jobs job-id) err-job-not-found))
      (client (get client job))
      (artist (get artist job))
      (amount (get amount job))
      (currency-type (get currency-type job))
      (token-addr (get token-contract job))
      (fee (/ (* amount platform-fee-percent) u1000))
      (payout (- amount fee))
    )
    (asserts! (is-eq tx-sender client) err-not-authorized)
    (asserts! (is-eq (get status job) "PENDING") err-invalid-status)

    (if (is-eq currency-type "STX")
      (begin
        (if (> fee u0)
          (try! (as-contract (contract-call? .prompthub-treasury deposit-stx fee)))
          true
        )
        (if (> payout u0)
          (try! (as-contract (stx-transfer? payout tx-sender artist)))
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
          (try! (as-contract (contract-call? sbtc-contract transfer payout tx-sender artist none)))
          true
        )
      )
    )

    (map-set jobs job-id (merge job { status: "COMPLETED" }))
    (ok true)
  )
)

;; =====================
;; Refund Job
;; Client OR admin can refund a PENDING job
;; =====================
(define-public (refund-job
    (job-id uint)
    (sbtc-contract <sip-010-trait>)
  )
  (let (
      (job (unwrap! (map-get? jobs job-id) err-job-not-found))
      (client (get client job))
      (amount (get amount job))
      (currency-type (get currency-type job))
      (token-addr (get token-contract job))
    )
    (asserts! (or (is-eq tx-sender client) (is-eq tx-sender (var-get platform-admin)))
      err-not-authorized
    )
    (asserts! (is-eq (get status job) "PENDING") err-invalid-status)

    (if (is-eq currency-type "STX")
      (if (> amount u0)
        (try! (as-contract (stx-transfer? amount tx-sender client)))
        true
      )
      (begin
        (asserts! (is-eq (contract-of sbtc-contract) token-addr) err-invalid-currency)
        (if (> amount u0)
          (try! (as-contract (contract-call? sbtc-contract transfer amount tx-sender client none)))
          true
        )
      )
    )
    (map-set jobs job-id (merge job { status: "REFUNDED" }))
    (ok true)
  )
)

;; =====================
;; Dispute Job
;; FIX: Artist can now trigger dispute themselves IF client has been idle
;; past the dispute-timeout-blocks window. Admin can always dispute.
;; =====================
(define-public (dispute-job (job-id uint))
  (let (
      (job (unwrap! (map-get? jobs job-id) err-job-not-found))
      (artist (get artist job))
      (created-at (get created-at-block job))
      (timeout-passed (>= block-height (+ created-at dispute-timeout-blocks)))
    )
    (asserts! (is-eq (get status job) "PENDING") err-invalid-status)
    ;; Admin can always dispute; artist can dispute after timeout
    (asserts!
      (or
        (is-eq tx-sender (var-get platform-admin))
        (and (is-eq tx-sender artist) timeout-passed)
      )
      err-not-authorized
    )
    (map-set jobs job-id (merge job { status: "DISPUTED" }))
    (ok true)
  )
)

;; =====================
;; Resolve Dispute (Admin only)
;; Sends full amount to the decided party — no fee on disputed funds
;; =====================
(define-public (resolve-dispute
    (job-id uint)
    (payout-to principal)
    (sbtc-contract <sip-010-trait>)
  )
  (let (
      (job (unwrap! (map-get? jobs job-id) err-job-not-found))
      (amount (get amount job))
      (currency-type (get currency-type job))
      (token-addr (get token-contract job))
    )
    (asserts! (is-eq tx-sender (var-get platform-admin)) err-not-authorized)
    (asserts! (is-eq (get status job) "DISPUTED") err-invalid-status)

    (if (is-eq currency-type "STX")
      (if (> amount u0)
        (try! (as-contract (stx-transfer? amount tx-sender payout-to)))
        true
      )
      (begin
        (asserts! (is-eq (contract-of sbtc-contract) token-addr) err-invalid-currency)
        (if (> amount u0)
          (try! (as-contract (contract-call? sbtc-contract transfer amount tx-sender payout-to none)))
          true
        )
      )
    )
    (map-set jobs job-id (merge job { status: "RESOLVED" }))
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
