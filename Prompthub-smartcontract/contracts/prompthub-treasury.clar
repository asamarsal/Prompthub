;; prompthub-treasury
;; Holds Platform Fees (2.5%) for STX and sBTC

(use-trait sip-010-trait .sip-010-trait-ft-standard.sip-010-trait)

(define-constant err-not-authorized (err u100))

;; FIX: Use data-var so admin can be transferred (e.g. to multisig)
(define-data-var platform-admin principal tx-sender)

;; =====================
;; Deposit Functions (callable by other contracts)
;; =====================

(define-public (deposit-stx (amount uint))
  (stx-transfer? amount tx-sender (as-contract tx-sender))
)

(define-public (deposit-sbtc
    (amount uint)
    (sbtc-contract <sip-010-trait>)
  )
  (contract-call? sbtc-contract transfer amount tx-sender (as-contract tx-sender) none)
)

;; =====================
;; Withdraw Functions (Admin only)
;; =====================

(define-public (withdraw-stx
    (amount uint)
    (recipient principal)
  )
  (begin
    (asserts! (is-eq tx-sender (var-get platform-admin)) err-not-authorized)
    (as-contract (stx-transfer? amount tx-sender recipient))
  )
)

(define-public (withdraw-sbtc
    (amount uint)
    (recipient principal)
    (sbtc-contract <sip-010-trait>)
  )
  (begin
    (asserts! (is-eq tx-sender (var-get platform-admin)) err-not-authorized)
    (as-contract (contract-call? sbtc-contract transfer amount tx-sender recipient none))
  )
)

;; =====================
;; Admin Management
;; =====================

;; FIX: Transfer admin to new principal (e.g. rotate to multisig wallet)
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get platform-admin)) err-not-authorized)
    (ok (var-set platform-admin new-admin))
  )
)

;; =====================
;; Read-Only
;; =====================

(define-read-only (get-stx-balance)
  (stx-get-balance (as-contract tx-sender))
)

(define-read-only (get-admin)
  (ok (var-get platform-admin))
)
