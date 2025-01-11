<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tloker extends Model
{
    use HasFactory;
    
    protected $fillable = ['nama', 'deskripsi', 'tingkat_pendidikan_minimal', 'tanggal_dibuka', 'tanggal_ditutup', 'kuota'];
}
