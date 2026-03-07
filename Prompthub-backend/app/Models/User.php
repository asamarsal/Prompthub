<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $primaryKey = 'stx_address';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'stx_address',
        'name',
        'bio',
        'avatar_url',
        'cover_url',
        'roles',
    ];

    protected function casts(): array
    {
        return [
            'roles' => 'array',
        ];
    }
}
