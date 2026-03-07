;; prompthub-marketplace
;; A marketplace contract for buying and selling AI prompts.

;; Constants
(define-constant err-not-authorized (err u100))
(define-constant err-prompt-already-exists (err u101))
(define-constant err-prompt-not-found (err u102))
(define-constant err-insufficient-funds (err u103))

(define-constant platform-admin tx-sender)
(define-constant platform-fee-percent u25) ;; 2.5% = 25 / 1000

;; Data Variables
(define-data-var next-prompt-id uint u1)

;; Maps
(define-map prompts
  uint
  {
    creator: principal,
    owner: principal,
    price: uint,
    is-active: bool
  }
)

;; Read-only functions
(define-read-only (get-prompt (prompt-id uint))
  (map-get? prompts prompt-id)
)

(define-read-only (get-owner (prompt-id uint))
  (get owner (map-get? prompts prompt-id))
)

;; Public functions

;; List a new prompt
(define-public (list-prompt (price uint))
  (let
    ((prompt-id (var-get next-prompt-id)))
    (map-set prompts prompt-id {
      creator: tx-sender,
      owner: tx-sender,
      price: price,
      is-active: true
    })
    (var-set next-prompt-id (+ prompt-id u1))
    (ok prompt-id)
  )
)

;; Buy a prompt
(define-public (buy-prompt (prompt-id uint))
  (let
    (
      (prompt (unwrap! (map-get? prompts prompt-id) err-prompt-not-found))
      (price (get price prompt))
      (seller (get owner prompt))
      (fee (/ (* price platform-fee-percent) u1000))
      (seller-amount (- price fee))
    )
    (asserts! (get is-active prompt) err-prompt-not-found)
    (asserts! (not (is-eq tx-sender seller)) err-not-authorized)
    
    ;; Transfer total fee to admin
    (try! (stx-transfer? fee tx-sender platform-admin))
    
    ;; Transfer the rest to seller
    (try! (stx-transfer? seller-amount tx-sender seller))
    
    ;; Update owner
    (map-set prompts prompt-id (merge prompt { owner: tx-sender, is-active: false }))
    
    (ok true)
  )
)
