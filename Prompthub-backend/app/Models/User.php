<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasUuids;

    protected $fillable = [
        'stx_address',
        'email',
        'google_id',
        'username',
        'name',
        'bio',
        'avatar_url',
        'cover_url',
        'roles',
        'is_available_for_freelance',
        'hourly_rate',
        'hourly_rate_currency',
    ];

    protected function casts(): array
    {
        return [
            'roles' => 'array',
            'is_available_for_freelance' => 'boolean',
            'hourly_rate' => 'decimal:4',
        ];
    }

    public function bookmarks()
    {
        return $this->hasMany(Bookmark::class);
    }

    public function bookmarkedPrompts()
    {
        return $this->belongsToMany(Prompt::class, 'bookmarks', 'user_id', 'prompt_id')->withTimestamps();
    }

    public function reviewsReceived()
    {
        return $this->hasMany(ArtistReview::class, 'artist_id');
    }
}
