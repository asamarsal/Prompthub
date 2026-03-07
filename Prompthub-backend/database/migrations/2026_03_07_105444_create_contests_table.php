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
        Schema::create('contests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('brand_address');
            $table->foreign('brand_address')->references('stx_address')->on('users')->onDelete('cascade');
            $table->string('title');
            $table->text('brief');
            $table->decimal('prize_sbtc', 18, 8)->nullable();
            $table->timestamp('deadline')->nullable();
            $table->string('status')->default('OPEN'); // OPEN, VOTING, COMPLETED, CANCELLED
            $table->uuid('winner_submission_id')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contests');
    }
};
