<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Tloker;

class LokerController extends Controller
{
    /**
     * Create a new ArticleController instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('auth:api');
    }

    public function index()
    {
        return Tloker::all();
    }

    public function show(Tloker $loker)
    {
        return $loker;
    }

    public function store(Request $request)
    {
        $loker = Tloker::create($request->all());

        return response()->json($loker, 201);
    }

    public function update(Request $request, Tloker $loker)
    {
        $loker->update($request->all());

        return response()->json($loker, 200);
    }

    public function delete(Tloker $loker)
    {
        $loker->delete();
        return response()->json([
            'success' => true,
            'message' => 'data terhapus'
        ], 200);
    }
}
