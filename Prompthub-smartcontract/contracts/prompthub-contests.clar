;; prompthub-contests
;; Escrow for contests where multiple artists submit and one wins.

(define-constant err-not-authorized (err u100))
(define-constant err-contest-not-found (err u101))
(define-constant err-invalid-status (err u102))

(define-data-var next-contest-id uint u1)

(define-map contests
  uint
  {
    brand: principal,
    prize-pool: uint,
    deadline: uint,
    status: (string-ascii 10) ;; "OPEN", "COMPLETED"
  }
)

(define-map submissions
  { contest-id: uint, artist: principal }
  { entry-id: (string-ascii 64) }
)

;; Create Contest
(define-public (fund-contest (prize-pool uint) (deadline uint))
  (let ((contest-id (var-get next-contest-id)))
    (try! (stx-transfer? prize-pool tx-sender (as-contract tx-sender)))
    (map-set contests contest-id {
      brand: tx-sender,
      prize-pool: prize-pool,
      deadline: deadline,
      status: "OPEN"
    })
    (var-set next-contest-id (+ contest-id u1))
    (ok contest-id)
  )
)

;; Submit Entry
(define-public (submit-entry (contest-id uint) (entry-id (string-ascii 64)))
  (let ((contest (unwrap! (map-get? contests contest-id) err-contest-not-found)))
    (asserts! (is-eq (get status contest) "OPEN") err-invalid-status)
    (map-set submissions { contest-id: contest-id, artist: tx-sender } { entry-id: entry-id })
    (ok true)
  )
)

;; Select Winner
(define-public (select-winner (contest-id uint) (winner principal))
  (let
    (
      (contest (unwrap! (map-get? contests contest-id) err-contest-not-found))
      (brand (get brand contest))
      (prize-pool (get prize-pool contest))
    )
    (asserts! (is-eq tx-sender brand) err-not-authorized)
    (asserts! (is-eq (get status contest) "OPEN") err-invalid-status)
    ;; Assert winner made a submission
    (unwrap! (map-get? submissions { contest-id: contest-id, artist: winner }) err-invalid-status)
    
    (try! (as-contract (stx-transfer? prize-pool tx-sender winner)))
    (map-set contests contest-id (merge contest { status: "COMPLETED" }))
    (ok true)
  )
)
