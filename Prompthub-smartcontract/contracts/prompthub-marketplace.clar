;; prompthub-marketplace
;; A marketplace contract for buying and selling AI prompts.
;; Implements SIP-009 NFT standard to show IPFS on Stacks Explorer.

(impl-trait 'SP2PABVDXOENQZ112FXONPEEXPEEXPEEXPEEXPEEX.nft-trait.nft-trait)

;; Constants
(define-constant err-not-authorized (err u100))
(define-constant err-prompt-already-exists (err u101))
(define-constant err-prompt-not-found (err u102))
(define-constant err-insufficient-funds (err u103))

(define-constant platform-admin tx-sender)
(define-constant platform-fee-percent u25) ;; 2.5% = 25 / 1000

;; Define the NFT
(define-non-fungible-token prompt uint)

;; Data Variables
(define-data-var last-prompt-id uint u0)

;; Maps
(define-map prompt-metadata uint (string-ascii 256)) ;; IPFS URI
(define-map prompts
  uint
  {
    creator: principal,
    price: uint,
    is-active: bool
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

(define-public (transfer (token-id uint) (sender principal) (recipient principal))
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
(define-public (list-prompt (ipfs-uri (string-ascii 256)) (price uint))
  (let
    ((prompt-id (+ (var-get last-prompt-id) u1)))
    
    ;; Mint the SIP-009 NFT
    (try! (nft-mint? prompt prompt-id tx-sender))
    
    ;; Save IPFS URI for Stacks Explorer
    (map-set prompt-metadata prompt-id ipfs-uri)
    
    ;; Save marketplace properties
    (map-set prompts prompt-id {
      creator: tx-sender,
      price: price,
      is-active: true
    })
    
    (var-set last-prompt-id prompt-id)
    (ok prompt-id)
  )
)

;; Buy a prompt
(define-public (buy-prompt (prompt-id uint))
  (let
    (
      (prompt-data (unwrap! (map-get? prompts prompt-id) err-prompt-not-found))
      (price (get price prompt-data))
      (seller (unwrap! (nft-get-owner? prompt prompt-id) err-prompt-not-found))
      (fee (/ (* price platform-fee-percent) u1000))
      (seller-amount (- price fee))
    )
    (asserts! (get is-active prompt-data) err-prompt-not-found)
    (asserts! (not (is-eq tx-sender seller)) err-not-authorized)
    
    ;; Transfer total fee to admin
    (try! (stx-transfer? fee tx-sender platform-admin))
    
    ;; Transfer the rest to seller
    (try! (stx-transfer? seller-amount tx-sender seller))
    
    ;; Transfer the NFT ownership via SIP-009
    (try! (nft-transfer? prompt prompt-id seller tx-sender))
    
    ;; Update marketplace status to inactive (cannot be bought again unless re-listed)
    (map-set prompts prompt-id (merge prompt-data { is-active: false }))
    
    (ok true)
  )
)
