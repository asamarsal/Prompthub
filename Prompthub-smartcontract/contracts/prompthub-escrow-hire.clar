;; prompthub-escrow-hire
;; Escrow contract for P2P designer hiring.
(use-trait sip-010-trait .sip-010-trait-ft-standard.sip-010-trait)

(define-constant err-not-authorized (err u1000))
(define-constant err-job-not-found (err u1001))
(define-constant err-invalid-status (err u1002))
(define-constant err-invalid-currency (err u1003))
(define-constant err-invalid-amount (err u1004))
(define-constant err-timeout-not-reached (err u1005))

(define-data-var contract-owner principal tx-sender)
(define-constant platform-fee-percent u25) ;; 2.5%

(define-map jobs
  uint
  {
    client: principal,
    artist: principal,
    amount: uint,
    status: (string-ascii 20), ;; "PENDING", "COMPLETED", "REFUNDED", "DISPUTED"
    currency-type: (string-ascii 10),
    token-contract: principal,
    created-at: uint,
  }
)

(define-data-var next-job-id uint u1)

;; Read-Only
(define-read-only (get-job (job-id uint))
  (map-get? jobs job-id)
)

;; Create Job (Client deposits STX/sBTC)
(define-public (create-hire-job
    (artist principal)
    (amount uint)
    (currency-type (string-ascii 10))
    (sbtc-contract <sip-010-trait>)
  )
  (let ((job-id (var-get next-job-id)))
    (asserts! (> amount u0) err-invalid-amount)
    ;; Kunci dana ke Smart Contract PENGAMAN
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
      created-at: block-height,
    })
    (var-set next-job-id (+ job-id u1))
    (ok job-id)
  )
)

;; Complete Job
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
        (asserts! (is-eq (contract-of sbtc-contract) token-addr)
          err-invalid-currency
        )
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

;; Refund Job
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
    (asserts! (or (is-eq tx-sender client) (is-eq tx-sender (var-get contract-owner)))
      err-not-authorized
    )
    (asserts! (is-eq (get status job) "PENDING") err-invalid-status)

    (if (is-eq currency-type "STX")
      (if (> amount u0)
        (try! (as-contract (stx-transfer? amount tx-sender client)))
        true
      )
      (begin
        (asserts! (is-eq (contract-of sbtc-contract) token-addr)
          err-invalid-currency
        )
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

;; Admin sets dispute
(define-public (dispute-job (job-id uint))
  (let ((job (unwrap! (map-get? jobs job-id) err-job-not-found)))
    (asserts! (is-eq tx-sender (var-get contract-owner)) err-not-authorized)
    (asserts! (is-eq (get status job) "PENDING") err-invalid-status)

    (map-set jobs job-id (merge job { status: "DISPUTED" }))
    (ok true)
  )
)

;; Admin resolve-dispute
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
    (asserts! (is-eq tx-sender (var-get contract-owner)) err-not-authorized)
    (asserts! (is-eq (get status job) "DISPUTED") err-invalid-status)

    (if (is-eq currency-type "STX")
      (if (> amount u0)
        (try! (as-contract (stx-transfer? amount tx-sender payout-to)))
        true
      )
      (begin
        (asserts! (is-eq (contract-of sbtc-contract) token-addr)
          err-invalid-currency
        )
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

;; Artist sets dispute (Timeout: 1 week approx 1008 blocks)
(define-public (dispute-job-artist (job-id uint))
  (let ((job (unwrap! (map-get? jobs job-id) err-job-not-found)))
    (asserts! (is-eq tx-sender (get artist job)) err-not-authorized)
    (asserts! (is-eq (get status job) "PENDING") err-invalid-status)
    (asserts! (> block-height (+ (get created-at job) u1008)) err-timeout-not-reached)

    (map-set jobs job-id (merge job { status: "DISPUTED" }))
    (ok true)
  )
)

;; Transfer Ownership
(define-public (transfer-ownership (new-owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) err-not-authorized)
    (ok (var-set contract-owner new-owner))
  )
)