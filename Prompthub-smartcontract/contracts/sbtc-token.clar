(impl-trait .sip-010-trait-ft-standard.sip-010-trait)

(define-fungible-token sbtc)

;; FIX: Use data-var instead of constant so ownership can be transferred
(define-data-var contract-owner principal tx-sender)
;; FIX: Minting can be permanently disabled before mainnet launch
(define-data-var minting-enabled bool true)

(define-constant err-not-authorized (err u401))
(define-constant err-minting-disabled (err u402))

;; =====================
;; SIP-010 Standard Functions
;; =====================
(define-public (transfer
    (amount uint)
    (sender principal)
    (recipient principal)
    (memo (optional (buff 34)))
  )
  (begin
    (asserts! (is-eq tx-sender sender) (err u4))
    (try! (ft-transfer? sbtc amount sender recipient))
    (match memo
      to-print (print to-print)
      0x
    )
    (ok true)
  )
)

(define-read-only (get-name)
  (ok "sBTC")
)

(define-read-only (get-symbol)
  (ok "sBTC")
)

(define-read-only (get-decimals)
  ;; sBTC uses 8 decimals
  (ok u8)
)

(define-read-only (get-balance (who principal))
  (ok (ft-get-balance sbtc who))
)

(define-read-only (get-total-supply)
  (ok (ft-get-supply sbtc))
)

(define-read-only (get-token-uri)
  (ok none)
)

;; =====================
;; Admin Functions
;; =====================

;; FIX: Transfer ownership in case of key rotation or multisig migration
(define-public (transfer-ownership (new-owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) err-not-authorized)
    (ok (var-set contract-owner new-owner))
  )
)

;; FIX: Permanently disable minting when supply is finalized for mainnet
(define-public (disable-minting)
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) err-not-authorized)
    (ok (var-set minting-enabled false))
  )
)

;; Mint — owner only + minting must be enabled
(define-public (mint
    (amount uint)
    (recipient principal)
  )
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) err-not-authorized)
    (asserts! (var-get minting-enabled) err-minting-disabled)
    (ft-mint? sbtc amount recipient)
  )
)

;; =====================
;; Read-Only Helpers
;; =====================
(define-read-only (get-contract-owner)
  (ok (var-get contract-owner))
)

(define-read-only (is-minting-enabled)
  (ok (var-get minting-enabled))
)
