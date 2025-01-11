<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTloker extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('tlokers', function (Blueprint $table) {
            $table->id();
            $table->string('nama', 100);
            $table->text('deskripsi');
            $table->string('tingkat_pendidikan_minimal', 100);
            $table->date('tanggal_dibuka');
            $table->date('tanggal_ditutup');
            $table->integer('kuota');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('tlokers');
    }
}
