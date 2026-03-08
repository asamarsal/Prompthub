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
        Schema::table('prompts', function (Blueprint $table) {
            // Change enum to string for more flexibility (AUDIO, CODE, etc.)
            $table->string('content_type')->default('IMAGE')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('prompts', function (Blueprint $table) {
            // Revert to original enum if needed
            $table->enum('content_type', ['TEXT', 'IMAGE', 'VIDEO'])->default('IMAGE')->change();
        });
    }
};
