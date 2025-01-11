<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

/* 
|--------------------------------------------------------------------------
| Example Routing 
|--------------------------------------------------------------------------
|
| Route::post('login', 'App\Http\Controllers\AuthController@login');
| Route::post('/login', App\Http\Controllers\Api\LoginController::class)->name('login');
| use  App\Http\Controllers\UserController;
| Route::post('/user/login', [UserController::class, 'login']);
|
*/

// Route::middleware('auth:api')->get('/user', function (Request $request) {
//     return $request->user();
// });


Route::group([
    'middleware' => ['auth:api']
], function () {
    // main function
    Route::post('logout', 'App\Http\Controllers\AuthController@logout');
    Route::post('refresh', 'App\Http\Controllers\AuthController@refresh');
    Route::get('user-profile', 'App\Http\Controllers\AuthController@userProfile');

    // loker
    Route::get('loker', 'App\Http\Controllers\LokerController@index');
    Route::get('loker/{loker}', 'App\Http\Controllers\LokerController@show');
    Route::post('loker', 'App\Http\Controllers\LokerController@store');
    Route::put('loker/{loker}', 'App\Http\Controllers\LokerController@update');
    Route::delete('loker/{loker}', 'App\Http\Controllers\LokerController@delete');
});

Route::post('login', 'App\Http\Controllers\AuthController@login');
Route::post('register', 'App\Http\Controllers\AuthController@register');

