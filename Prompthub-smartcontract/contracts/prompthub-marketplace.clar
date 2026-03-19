;; prompthub-marketplace
;; A marketplace contract for buying and selling AI prompts.
;; Implements SIP-009 NFT standard to show IPFS on Stacks Explorer.

(impl-trait .nft-trait.nft-trait)
(use-trait sip-010-trait .sip-010-trait-ft-standard.sip-010-trait)

;; =====================
;; Constants & Errors
;; =====================
(define-constant err-not-authorized (err u100))
(define-constant err-prompt-not-found (err u102))
(define-constant err-invalid-currency (err u103))
;; FIX: new error codes for input validation
(define-constant err-invalid-amount (err u104))
(define-constant err-invalid-royalty (err u105))

(define-constant platform-fee-percent u25) ;; 2.5% = 25 / 1000
;; FIX: Maximum royalty cap = 20% (200/1000) to prevent seller-amount underflow
(define-constant max-royalty-percent u200)

;; =====================
;; NFT & Storage
;; =====================
(define-non-fungible-token prompt uint)
(define-data-var last-prompt-id uint u0)

(define-map prompt-metadata
  uint
  (string-ascii 256)
)

(define-map prompts
  uint
  {
    creator: principal,
    price: uint,
    currency-type: (string-ascii 10), ;; "STX" or "sBTC"
    royalty-percent: uint,             ;; 0-200 (e.g. 50 = 5%)
    is-active: bool,
  }
)

;; =====================
;; SIP-009 Functions
;; =====================
(define-read-only (get-last-token-id)
  (ok (var-get last-prompt-id))
)

(define-read-only (get-token-uri (token-id uint))
  (ok (map-get? prompt-metadata token-id))
)

(define-read-only (get-owner (token-id uint))
  (ok (nft-get-owner? prompt token-id))
)

(define-public (transfer
    (token-id uint)
    (sender principal)
    (recipient principal)
  )
  (begin
    (asserts! (is-eq tx-sender sender) err-not-authorized)
    (nft-transfer? prompt token-id sender recipient)
  )
)

;; =====================
;; Read-Only Helpers
;; =====================
(define-read-only (get-prompt (prompt-id uint))
  (map-get? prompts prompt-id)
)

;; =====================
;; Marketplace Functions
;; =====================

;; Mint / List a new prompt (Requires IPFS URI)
(define-public (list-prompt
    (ipfs-uri (string-ascii 256))
    (price uint)
    (currency-type (string-ascii 10))
    (royalty-percent uint)
  )
  (let ((prompt-id (+ (var-get last-prompt-id) u1)))
    ;; FIX: Validate price > 0
    (asserts! (> price u0) err-invalid-amount)
    ;; FIX: Validate royalty within allowed range (max 20%)
    (asserts! (<= royalty-percent max-royalty-percent) err-invalid-royalty)
    ;; FIX: Validate currency is a known type
    (asserts! (or (is-eq currency-type "STX") (is-eq currency-type "sBTC")) err-invalid-currency)

    ;; Mint the SIP-009 NFT to the contract for escrow
    (try! (as-contract (nft-mint? prompt prompt-id tx-sender)))

    ;; Save IPFS URI for Stacks Explorer
    (map-set prompt-metadata prompt-id ipfs-uri)

    ;; Save marketplace properties
    (map-set prompts prompt-id {
      creator: tx-sender,
      price: price,
      currency-type: currency-type,
      royalty-percent: royalty-percent,
      is-active: true,
    })

    (var-set last-prompt-id prompt-id)
    (ok prompt-id)
  )
)

;; Delist a prompt (returns NFT to creator)
(define-public (delist-prompt (prompt-id uint))
  (let (
      (prompt-data (unwrap! (map-get? prompts prompt-id) err-prompt-not-found))
      (creator (get creator prompt-data))
    )
    (asserts! (is-eq tx-sender creator) err-not-authorized)
    (asserts! (get is-active prompt-data) err-prompt-not-found)

    ;; Transfer the NFT back from the contract to the creator
    (try! (as-contract (nft-transfer? prompt prompt-id tx-sender creator)))

    ;; Deactivate the listing
    (map-set prompts prompt-id (merge prompt-data { is-active: false }))
    (ok true)
  )
)

;; Update price or currency of an active listing
(define-public (update-price
    (prompt-id uint)
    (new-price uint)
    (new-currency (string-ascii 10))
  )
  (let (
      (prompt-data (unwrap! (map-get? prompts prompt-id) err-prompt-not-found))
      (creator (get creator prompt-data))
    )
    (asserts! (is-eq tx-sender creator) err-not-authorized)
    (asserts! (get is-active prompt-data) err-prompt-not-found)
    ;; FIX: Validate new price > 0
    (asserts! (> new-price u0) err-invalid-amount)
    ;; FIX: Validate new currency is a known type (prevents garbage string)
    (asserts! (or (is-eq new-currency "STX") (is-eq new-currency "sBTC")) err-invalid-currency)

    (map-set prompts prompt-id
      (merge prompt-data {
        price: new-price,
        currency-type: new-currency,
      })
    )
    (ok true)
  )
)

;; Buy a prompt
(define-public (buy-prompt
    (prompt-id uint)
    (sbtc-contract <sip-010-trait>)
  )
  (let (
      (prompt-data (unwrap! (map-get? prompts prompt-id) err-prompt-not-found))
      (price (get price prompt-data))
      (currency-type (get currency-type prompt-data))
      (creator (get creator prompt-data))
      (royalty-pct (get royalty-percent prompt-data))
      (seller (unwrap! (nft-get-owner? prompt prompt-id) err-prompt-not-found))
      (fee (/ (* price platform-fee-percent) u1000))
      (royalty (/ (* price royalty-pct) u1000))
      ;; If primary sale (seller is creator), no royalty split — full amount minus fee to seller
      (seller-amount (if (is-eq seller creator)
        (- price fee)
        (- (- price fee) royalty)
      ))
    )
    (asserts! (get is-active prompt-data) err-prompt-not-found)
    (asserts! (not (is-eq tx-sender seller)) err-not-authorized)

    (if (is-eq currency-type "STX")
      (begin
        (if (> fee u0)
          (try! (contract-call? .prompthub-treasury deposit-stx fee))
          true
        )
        (if (and (> royalty u0) (not (is-eq seller creator)))
          (try! (stx-transfer? royalty tx-sender creator))
          true
        )
        (if (> seller-amount u0)
          (try! (stx-transfer? seller-amount tx-sender seller))
          true
        )
      )
      (begin
        ;; FIX: This check is now guaranteed to pass since list-prompt validates currency
        (asserts! (is-eq currency-type "sBTC") err-invalid-currency)
        (if (> fee u0)
          (try! (contract-call? .prompthub-treasury deposit-sbtc fee sbtc-contract))
          true
        )
        (if (and (> royalty u0) (not (is-eq seller creator)))
          (try! (contract-call? sbtc-contract transfer royalty tx-sender creator none))
          true
        )
        (if (> seller-amount u0)
          (try! (contract-call? sbtc-contract transfer seller-amount tx-sender seller none))
          true
        )
      )
    )

    (let ((buyer tx-sender))
      ;; Transfer NFT ownership from escrow to buyer
      (try! (as-contract (nft-transfer? prompt prompt-id tx-sender buyer)))
    )

    ;; Deactivate listing
    (map-set prompts prompt-id (merge prompt-data { is-active: false }))
    (ok true)
  )
)
