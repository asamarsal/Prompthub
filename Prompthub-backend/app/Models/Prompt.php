<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Prompt extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'user_id',
        'title',
        'description',
        'price_stx',
        'preview_image_url',
        'cid_ipfs',
        'ai_model',
        'category',
        'tags',
        'content_type',
        'is_nsfw',
        'license_type',
        'royalty_percentage',
        'is_published',
        'is_curated',
        'total_sold',
        'original_content'
    ];

    protected $casts = [
        'tags' => 'array',
        'price_stx' => 'decimal:6',
        'is_nsfw' => 'boolean',
        'is_published' => 'boolean',
        'is_curated' => 'boolean',
        'royalty_percentage' => 'integer',
        'total_sold' => 'integer'
    ];

    public function bookmarkedBy()
    {
        return $this->belongsToMany(User::class, 'bookmarks', 'prompt_id', 'user_id')->withTimestamps();
    }
}
