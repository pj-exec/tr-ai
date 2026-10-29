<?php

use App\Http\Controllers\AIContoller;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get("/", function () {
    return Inertia::render("Welcome", [
        "canLogin" => Route::has("login"),
        "canRegister" => Route::has("register"),
        "laravelVersion" => Application::VERSION,
        "phpVersion" => PHP_VERSION,
        "appVersion" => config("app.version"),
    ]);
});

/*
 |--------------------------------------------------------------------------
 | After Login Pages
 |--------------------------------------------------------------------------
 */
Route::get("/dashboard", function () {
    return Inertia::render("Dashboard");
})
    ->middleware(["auth", "verified"])
    ->name("dashboard");

Route::get("/banner", function () {
    return Inertia::render("Banner");
})
    ->middleware(["auth", "verified"])
    ->name("banner");

Route::get("/cast", function () {
    return Inertia::render("Cast");
})
    ->middleware(["auth", "verified"])
    ->name("cast");

Route::get("/cg-modeling", function () {
    return Inertia::render("CgModeling");
})
    ->middleware(["auth", "verified"])
    ->name("cg-modeling");

Route::get("/chat", function () {
    return Inertia::render("Chat");
})
    ->middleware(["auth", "verified"])
    ->name("chat");

Route::get("/lp-coding", function () {
    return Inertia::render("LpCoding");
})
    ->middleware(["auth", "verified"])
    ->name("lp-coding");

Route::get("/proofread", function () {
    return Inertia::render("Proofread");
})
    ->middleware(["auth", "verified"])
    ->name("proofread");

Route::get("/voice", function () {
    return Inertia::render("Voice");
})
    ->middleware(["auth", "verified"])
    ->name("voice");

Route::get("/sys-coding", function () {
    return Inertia::render("SysCoding");
})
    ->middleware(["auth", "verified"])
    ->name("sys-coding");

Route::get("/option", function () {
    return Inertia::render("Option");
})
    ->middleware(["auth", "verified"])
    ->name("option");

/*
 |--------------------------------------------------------------------------
 | Profile
 |--------------------------------------------------------------------------
 */
Route::middleware("auth")->group(function () {
    Route::get("/profile", [ProfileController::class, "edit"])->name(
        "profile.edit"
    );
    Route::patch("/profile", [ProfileController::class, "update"])->name(
        "profile.update"
    );
    Route::delete("/profile", [ProfileController::class, "destroy"])->name(
        "profile.destroy"
    );

    Route::post("/chat-message", [
        AIContoller::class,
        "generateChatResponse",
    ])->name("openai.chat");

    Route::post("/voice", [AIContoller::class, "voice"])->name("openai.voice");

    Route::post("/edit-image", [AIContoller::class, "editImage"])->name(
        "openai.editImage"
    );
});

require __DIR__ . "/auth.php";
