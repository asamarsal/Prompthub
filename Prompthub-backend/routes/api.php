<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\PromptController;
use App\Http\Controllers\ContestController;
use App\Http\Controllers\HireRequestController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\NotificationController;

Route::post('/auth/login', [AuthController::class, 'login']);

// Public routes
Route::get('/prompts', [PromptController::class, 'index']);
Route::get('/prompts/{id}', [PromptController::class, 'show']);
Route::get('/contests', [ContestController::class, 'index']);
Route::get('/contests/{id}', [ContestController::class, 'show']);

// Protected routes (requires Sanctum token)
Route::middleware('auth:sanctum')->group(function () {
    // Users
    Route::get('/users/me', [AuthController::class, 'me']);
    Route::put('/users/me', [AuthController::class, 'update']);
    
    // Prompts
    Route::post('/prompts', [PromptController::class, 'store']);
    Route::post('/prompts/{id}/verify-purchase', [PromptController::class, 'verifyPurchase']);

    // Contests
    Route::post('/contests', [ContestController::class, 'store']);
    Route::post('/contests/{id}/verify-fund', [ContestController::class, 'verifyFund']);
    Route::post('/contests/{id}/submit', [ContestController::class, 'submit']);
    Route::post('/contests/{id}/select-winner', [ContestController::class, 'selectWinner']);

    // Hire
    Route::get('/hire/my-requests', [HireRequestController::class, 'index']);
    Route::post('/hire', [HireRequestController::class, 'store']);
    Route::post('/hire/{id}/verify-escrow', [HireRequestController::class, 'verifyEscrow']);
    Route::put('/hire/{id}/status', [HireRequestController::class, 'updateStatus']);

    // Messages
    Route::get('/messages', [MessageController::class, 'index']);
    Route::post('/messages', [MessageController::class, 'store']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::put('/notifications/read', [NotificationController::class, 'markAsRead']);
});
