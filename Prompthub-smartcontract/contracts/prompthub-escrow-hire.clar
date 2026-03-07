;; prompthub-escrow-hire
;; Escrow contract for P2P designer hiring.

(define-constant err-not-authorized (err u100))
(define-constant err-job-not-found (err u101))
(define-constant err-invalid-status (err u102))

(define-constant platform-admin tx-sender)
(define-constant platform-fee-percent u25) ;; 2.5%

(define-map jobs
  uint
  {
    client: principal,
    artist: principal,
    amount: uint,
    status: (string-ascii 20) ;; "PENDING", "COMPLETED", "REFUNDED", "DISPUTED"
  }
)

(define-data-var next-job-id uint u1)

(define-map artist-balances principal uint)

;; Read-Only
(define-read-only (get-job (job-id uint))
  (map-get? jobs job-id)
)

(define-read-only (get-artist-balance (artist principal))
  (default-to u0 (map-get? artist-balances artist))
)

;; Create Job (Client deposits STX)
(define-public (create-hire-job (artist principal) (amount uint))
  (let ((job-id (var-get next-job-id)))
    ;; Kunci dana ke Smart Contract PENGAMAN
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    (map-set jobs job-id {
      client: tx-sender,
      artist: artist,
      amount: amount,
      status: "PENDING"
    })
    (var-set next-job-id (+ job-id u1))
    (ok job-id)
  )
)

;; Complete Job
(define-public (complete-job (job-id uint))
  (let
    (
      (job (unwrap! (map-get? jobs job-id) err-job-not-found))
      (client (get client job))
      (artist (get artist job))
      (amount (get amount job))
      (fee (/ (* amount platform-fee-percent) u1000))
      (payout (- amount fee))
      (current-balance (get-artist-balance artist))
    )
    (asserts! (is-eq tx-sender client) err-not-authorized)
    (asserts! (is-eq (get status job) "PENDING") err-invalid-status)
    
    ;; Fee to admin langsung cair
    (try! (as-contract (stx-transfer? fee tx-sender platform-admin)))
    
    ;; Payout ke saldo internal kontrak Artist (belum cair ke wallet asli)
    (map-set artist-balances artist (+ current-balance payout))
    
    (map-set jobs job-id (merge job { status: "COMPLETED" }))
    (ok true)
  )
)

;; Withdraw Funds (Minimal 10 STX = 10000000 mSTX)
(define-public (withdraw-funds)
  (let
    (
      (balance (get-artist-balance tx-sender))
    )
    ;; Minimal 10 STX (asumsi 1 STX = 1.000.000 uSTX)
    (asserts! (>= balance u10000000) err-not-authorized) 
    
    ;; Reset saldo internal jadi 0
    (map-set artist-balances tx-sender u0)
    
    ;; Kirim uang sungguhan dari Contract Vault ke Wallet Artist
    (try! (as-contract (stx-transfer? balance tx-sender tx-sender)))
    
    (ok balance)
  )
)

;; Refund Job
(define-public (refund-job (job-id uint))
  (let
    (
      (job (unwrap! (map-get? jobs job-id) err-job-not-found))
      (client (get client job))
      (amount (get amount job))
    )
    (asserts! (or (is-eq tx-sender client) (is-eq tx-sender platform-admin)) err-not-authorized)
    (asserts! (is-eq (get status job) "PENDING") err-invalid-status)
    
    (try! (as-contract (stx-transfer? amount tx-sender client)))
    (map-set jobs job-id (merge job { status: "REFUNDED" }))
    (ok true)
  )
)

;; Admin sets dispute
(define-public (dispute-job (job-id uint))
  (let ((job (unwrap! (map-get? jobs job-id) err-job-not-found)))
    (asserts! (is-eq tx-sender platform-admin) err-not-authorized)
    (asserts! (is-eq (get status job) "PENDING") err-invalid-status)
    
    (map-set jobs job-id (merge job { status: "DISPUTED" }))
    (ok true)
  )
)

;; Admin resolve-dispute
(define-public (resolve-dispute (job-id uint) (payout-to principal))
  (let
    (
      (job (unwrap! (map-get? jobs job-id) err-job-not-found))
      (amount (get amount job))
    )
    (asserts! (is-eq tx-sender platform-admin) err-not-authorized)
    (asserts! (is-eq (get status job) "DISPUTED") err-invalid-status)
    
    (try! (as-contract (stx-transfer? amount tx-sender payout-to)))
    (map-set jobs job-id (merge job { status: "RESOLVED" }))
    (ok true)
  )
)
