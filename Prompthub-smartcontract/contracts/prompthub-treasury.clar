;; prompthub-treasury
;; Holds Platform Fees (2.5%) for STX and sBTC

(use-trait sip-010-trait .sip-010-trait-ft-standard.sip-010-trait)

(define-constant err-not-authorized (err u100))

(define-data-var contract-owner principal tx-sender)

;; Deposit STX (called by anyone, usually other contracts)
(define-public (deposit-stx (amount uint))
  (stx-transfer? amount tx-sender (as-contract tx-sender))
)

;; Deposit sBTC
(define-public (deposit-sbtc
    (amount uint)
    (sbtc-contract <sip-010-trait>)
  )
  (contract-call? sbtc-contract transfer amount tx-sender (as-contract tx-sender)
    none
  )
)

;; Withdraw STX (Only Admin)
(define-public (withdraw-stx
    (amount uint)
    (recipient principal)
  )
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) err-not-authorized)
    (as-contract (stx-transfer? amount tx-sender recipient))
  )
)

;; Withdraw sBTC (Only Admin)
(define-public (withdraw-sbtc
    (amount uint)
    (recipient principal)
    (sbtc-contract <sip-010-trait>)
  )
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) err-not-authorized)
    (as-contract (contract-call? sbtc-contract transfer amount tx-sender recipient none))
  )
)

;; Read-Only Balances
(define-read-only (get-stx-balance)
  (stx-get-balance (as-contract tx-sender))
)

;; Transfer Ownership
(define-public (transfer-ownership (new-owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) err-not-authorized)
    (ok (var-set contract-owner new-owner))
  )
)
