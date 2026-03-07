<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('prompts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('creator_address');
            $table->foreign('creator_address')->references('stx_address')->on('users')->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->decimal('price_stx', 18, 8)->nullable();
            $table->decimal('price_sbtc', 18, 8)->nullable();
            $table->string('preview_image_url')->nullable();
            $table->string('cid_ipfs')->nullable();
            $table->string('ai_model')->nullable();
            $table->string('category')->nullable();
            $table->boolean('is_published')->default(true);
            $table->integer('total_sold')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('prompts');
    }
};
