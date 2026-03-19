;; prompthub-marketplace
;; A marketplace contract for buying and selling AI prompts.
;; Implements SIP-009 NFT standard to show IPFS on Stacks Explorer.

(impl-trait .nft-trait.nft-trait)

;; Constants
(use-trait sip-010-trait .sip-010-trait-ft-standard.sip-010-trait)

(define-constant err-not-authorized (err u100))
(define-constant err-prompt-not-found (err u102))
(define-constant err-invalid-currency (err u103))

(define-constant platform-fee-percent u25) ;; 2.5% = 25 / 1000

;; Define the NFT
(define-non-fungible-token prompt uint)

;; Data Variables
(define-data-var last-prompt-id uint u0)

;; Maps
(define-map prompt-metadata
  uint
  (string-ascii 256)
)
;; IPFS URI
(define-map prompts
  uint
  {
    creator: principal,
    price: uint,
    currency-type: (string-ascii 10), ;; "STX" or "sBTC"
    royalty-percent: uint, ;; 0-1000 (e.g. 50 = 5%)
    is-active: bool,
  }
)

;; SIP-009 Functions
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

;; Custom Marketplace Functions

;; Read-only prompt details
(define-read-only (get-prompt (prompt-id uint))
  (map-get? prompts prompt-id)
)

;; Mint / List a new prompt (Requires IPFS URI)
(define-public (list-prompt
    (ipfs-uri (string-ascii 256))
    (price uint)
    (currency-type (string-ascii 10))
    (royalty-percent uint)
  )
  (let ((prompt-id (+ (var-get last-prompt-id) u1)))
    ;; Mint the SIP-009 NFT
    (try! (nft-mint? prompt prompt-id tx-sender))

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
      ;; If primary sale (seller is creator), royalty stays with seller
      (seller-amount (if (is-eq seller creator)
        (- price fee)
        (- (- price fee) royalty)
      ))
    )
    (asserts! (get is-active prompt-data) err-prompt-not-found)
    (asserts! (not (is-eq tx-sender seller)) err-not-authorized)

    (if (is-eq currency-type "STX")
      (begin
        ;; Transfer STX Fee to Treasury
        (if (> fee u0)
          (try! (contract-call? .prompthub-treasury deposit-stx fee))
          true
        )
        ;; Transfer Royalty to original Creator (if this is a secondary sale)
        (if (and (> royalty u0) (not (is-eq seller creator)))
          (try! (stx-transfer? royalty tx-sender creator))
          true
        )
        ;; Transfer strictly-seller remainder
        (if (> seller-amount u0)
          (try! (stx-transfer? seller-amount tx-sender seller))
          true
        )
      )
      (begin
        ;; Verify correct sBTC contract is being passed dynamically
        (asserts! (is-eq currency-type "sBTC") err-invalid-currency)
        ;; Transfer sBTC Fee to Treasury
        (if (> fee u0)
          (try! (contract-call? .prompthub-treasury deposit-sbtc fee sbtc-contract))
          true
        )
        ;; Transfer Royalty to original Creator (if this is a secondary sale)
        (if (and (> royalty u0) (not (is-eq seller creator)))
          (try! (contract-call? sbtc-contract transfer royalty tx-sender creator none))
          true
        )
        ;; Transfer remainder
        (if (> seller-amount u0)
          (try! (contract-call? sbtc-contract transfer seller-amount tx-sender seller
            none
          ))
          true
        )
      )
    )

    ;; Transfer the NFT ownership via SIP-009
    (try! (nft-transfer? prompt prompt-id seller tx-sender))

    ;; Update marketplace status to inactive (cannot be bought again unless re-listed)
    (map-set prompts prompt-id (merge prompt-data { is-active: false }))

    (ok true)
  )
)
