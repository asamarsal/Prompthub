<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\PromptController;
use App\Http\Controllers\ContestController;
use App\Http\Controllers\HireRequestController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\AiModelController;

use App\Http\Controllers\BookmarkController;

Route::post('/auth/login', [AuthController::class, 'login']);
Route::get('/users/{address}', [AuthController::class, 'show']);

// Public routes
Route::get('/prompts', [PromptController::class, 'index']);
Route::get('/prompts/{id}', [PromptController::class, 'show']);
Route::get('/contests', [ContestController::class, 'index']);
Route::get('/contests/{id}', [ContestController::class, 'show']);
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/ai-models', [AiModelController::class, 'index']);

// Protected routes (requires Sanctum token)
Route::middleware('auth:sanctum')->group(function () {
    // Users
    Route::get('/users/me', [AuthController::class, 'me']);
    Route::put('/users/me', [AuthController::class, 'update']);
    Route::post('/users/upload', [\App\Http\Controllers\FileController::class, 'uploadToIpfs']);
    
    // Taxonomy
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::post('/ai-models', [AiModelController::class, 'store']);
    
    // Prompts
    Route::post('/prompts', [PromptController::class, 'store']);
    Route::post('/prompts/{id}/verify-purchase', [PromptController::class, 'verifyPurchase']);
    Route::put('/prompts/{id}/curate', [PromptController::class, 'curate']);

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

    // Bookmarks
    Route::get('/users/me/bookmarks', [BookmarkController::class, 'index']);
    Route::post('/prompts/{id}/bookmark', [BookmarkController::class, 'toggle']);
});
