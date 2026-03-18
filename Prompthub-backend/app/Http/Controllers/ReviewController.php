<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Models\Prompt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReviewController extends Controller
{
    public function index($promptId)
    {
        $reviews = Review::with('reviewer:stx_address,name,avatar_url')
            ->where('prompt_id', $promptId)
            ->latest()
            ->paginate(10);

        return response()->json($reviews);
    }

    public function store(Request $request, $promptId)
    {
        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $prompt = Prompt::findOrFail($promptId);

        // Verification logic could go here (e.g., check if user purchased the prompt)

        $review = Review::updateOrCreate(
            ['prompt_id' => $promptId, 'reviewer_address' => $user->stx_address],
            ['rating' => $request->rating, 'comment' => $request->comment]
        );

        // Recalculate prompt average rating if needed
        
        return response()->json([
            'message' => 'Review submitted successfully.',
            'review' => $review
        ]);
    }
}
