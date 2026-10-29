<?php

namespace App\Http\Controllers;

use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use OpenAI\Laravel\Facades\OpenAI;
use Illuminate\Support\Facades\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AIContoller extends Controller
{
    /**
     * Chat response
     */
    public function generateChatResponse(Request $request)
    {
        $request->validate([
            "messages" => "required",
            "model" => "string|required",
            "type" => "string|required",
        ]);
        $messages = $request->input("messages");
        $model = $request->input("model");
        $type = $request->input("type");

        if ($type == "gemini") {
            return new StreamedResponse(
                function () use ($model, $messages) {
                    set_time_limit(0);
                    ini_set("zlib.output_compression", 0);
                    ini_set("implicit_flush", 1);
                    ob_implicit_flush(1);

                    $stream = Http::withHeaders([
                        "Authorization" => "Bearer " . env("GEMINI_API_KEY"),
                        "Content-Type" => "application/json",
                    ])
                        ->withOptions(["stream" => true])
                        ->post(
                            "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
                            [
                                "model" => $model,
                                "messages" => $messages,
                                "stream" => true,
                            ]
                        );
                    $body = $stream->getBody();
                    $buffer = "";

                    while (!$body->eof()) {
                        $buffer .= $body->read(1024);

                        while (($pos = strpos($buffer, "\n")) !== false) {
                            $line = trim(substr($buffer, 0, $pos));
                            $buffer = substr($buffer, $pos + 1);

                            if (str_starts_with($line, "data:")) {
                                $json = trim(substr($line, 5));
                                if ($json === "[DONE]") {
                                    break 2;
                                }

                                $data = json_decode($json, true);
                                $delta =
                                    $data["choices"][0]["delta"]["content"] ??
                                    "";
                                if ($delta) {
                                    echo $delta;
                                    ob_flush();
                                    flush();
                                }
                            }
                        }
                    }
                },
                200,
                [
                    "Content-Type" => "text/event-stream",
                    "Cache-Control" => "no-cache",
                    "X-Accel-Buffering" => "no", // for Nginx: disables response buffering
                ]
            );
        } else {
            return Response::stream(
                function () use ($messages, $model) {
                    // Optional: increase buffer limits if needed
                    set_time_limit(0);
                    ini_set("zlib.output_compression", 0);
                    ini_set("implicit_flush", 1);
                    ob_implicit_flush(1);

                    $stream = OpenAI::chat()->createStreamed([
                        "model" => $model,
                        "messages" => $messages,
                    ]);

                    foreach ($stream as $response) {
                        $delta = $response->choices[0]->delta->content ?? "";

                        if ($delta !== "") {
                            echo $delta;
                            if (ob_get_level() > 0) {
                                ob_flush();
                            }
                            flush();
                        }
                    }
                },
                200,
                [
                    "Content-Type" => "text/plain", // or text/event-stream if using SSE
                    "Cache-Control" => "no-cache",
                    "X-Accel-Buffering" => "no", // for NGINX to disable buffering
                ]
            );
        }
    }

    /**
     *  text to voice
     */
    public function voice(Request $request)
    {
        $validated = $request->validate([
            "title" => "nullable|string",
            "message" => "string|required",
            "voice" => "string|required",
            "type" => "string|required",
            "model" => "string|required",
        ]);
        $model = $validated["model"];
        $type = $validated["type"];
        $voice = $validated["voice"];
        $input = $validated["message"];
        $title = $validated["title"] ?? "";
        $apiKey = env("GEMINI_API_KEY");

        if ($type == "gemini") {
            if ($voice == "onyx") {
                $voice = "Puck";
            } else {
                $voice = "Zephyr";
            }
            $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";
            $payload = [
                "contents" => [
                    [
                        "parts" => [
                            [
                                "text" => "Say {$title} : {$input}",
                            ],
                        ],
                    ],
                ],
                "generationConfig" => [
                    "responseModalities" => ["AUDIO"],
                    "speechConfig" => [
                        "voiceConfig" => [
                            "prebuiltVoiceConfig" => [
                                "voiceName" => $voice,
                            ],
                        ],
                    ],
                ],
                "model" => $model,
            ];
            $response = Http::withHeaders([
                "Content-Type" => "application/json",
            ])->post($url, $payload);
            $data = $response->json();
            if ($response->successful()) {
                $base64 =
                    $data["candidates"][0]["content"]["parts"][0]["inlineData"][
                        "data"
                    ] ?? null;
                $pcmRaw = base64_decode($base64);

                $pcmPath = storage_path("app/tts.pcm");
                $wavPath = storage_path("app/tts.wav");
                file_put_contents($pcmPath, $pcmRaw);

                // Convert PCM to WAV using ffmpeg
                exec("ffmpeg -y -f s16le -ar 24000 -ac 1 -i $pcmPath $wavPath");
                $ffmpegPath = "/usr/bin/ffmpeg";
                $cmd = "$ffmpegPath -y -f s16le -ar 24000 -ac 1 -i $pcmPath $wavPath 2>&1";
                exec($cmd, $output, $status);
                if ($status !== 0) {
                    // Command failed
                    // $output contains error messages or warnings
                    return response()->json(
                        [
                            "success" => false,
                            "status" => $status,
                            "error_output" => $output,
                            "message" => "Command failed to execute",
                        ],
                        500
                    );
                }

                // Command succeeded
                return response(file_get_contents($wavPath), 200)
                    ->header("Content-Type", "audio/wav")
                    ->header(
                        "Content-Disposition",
                        'inline; filename="speech.wav"'
                    );
            } else {
                return response()->json(
                    [
                        "error" => "Failed to fetch response from OpenAI.",
                        "details" => $response->json(),
                    ],
                    $response->status()
                );
            }
        } else {
            $response = Http::withHeaders([
                "Authorization" => "Bearer " . env("OPENAI_API_KEY"),
                "Content-Type" => "application/json",
            ])->post("https://api.openai.com/v1/audio/speech", [
                "model" => $model,
                "voice" => $voice,
                "input" => $input,
                "instructions" => $title,
            ]);

            if ($response->successful()) {
                return response($response->body(), 200)
                    ->header("Content-Type", "audio/mpeg")
                    ->header(
                        "Content-Disposition",
                        'inline; filename="speech.mp3"'
                    );
            } else {
                return response()->json(
                    [
                        "error" => "Failed to fetch response from OpenAI.",
                        "details" => $response->json(),
                    ],
                    $response->status()
                );
            }
        }
    }

    /**
     *  edit images
     */
    public function editImage(Request $request)
    {
        try {
            $request->validate([
                "images.*" => "required|image|mimes:jpeg,png",
                "prompt" => "required|string",
                "n" => "required|integer",
                "model" => "string|required",
                "type" => "string|required",
            ]);
            ini_set("max_execution_time", 0); // unlimited time
            ini_set("memory_limit", "-1"); // unlimited memory
            set_time_limit(0); // same as above

            $prompt = $request->input("prompt");
            $n = $request->input("n");
            $model = $request->input("model");
            $type = $request->input("type");

            if ($type == "gemini") {
                $googleApiKey = env("GEMINI_API_KEY");

                $inlineParts = [];

                foreach ($request->file("images") as $image) {
                    $mimeType = $image->getMimeType(); // e.g., image/png
                    $base64Data = base64_encode(
                        file_get_contents($image->getRealPath())
                    );

                    $inlineParts[] = [
                        "inlineData" => [
                            "mimeType" => $mimeType,
                            "data" => $base64Data,
                        ],
                    ];
                }

                // Add the prompt at the end
                $inlineParts[] = [
                    "text" => "{$prompt}",
                ];
                $payload = [
                    "contents" => [
                        [
                            "role" => "user",
                            "parts" => $inlineParts,
                        ],
                    ],
                    "generationConfig" => [
                        "responseModalities" => ["IMAGE", "TEXT"],
                        "responseMimeType" => "text/plain",
                    ],
                ];

                $response = Http::withHeaders([
                    "Content-Type" => "application/json",
                ])->post(
                    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=$googleApiKey",
                    $payload
                );

                if (!$response->successful()) {
                    return response()->json(
                        [
                            "error" => "Generation failed",
                            "details" => $response->json(),
                        ],
                        $response->status()
                    );
                }

                $images = [];
                $candidates = $response->json("candidates") ?? [];

                foreach ($candidates as $candidate) {
                    $parts = $candidate["content"]["parts"] ?? [];

                    foreach ($parts as $part) {
                        if (isset($part["inlineData"]["data"])) {
                            $images[] = [
                                "b64_json" => $part["inlineData"]["data"],
                            ];
                        }
                    }
                }
                return response()->json(
                    [
                        "data" => $images,
                    ],
                    $response->status()
                );
            } else {
                $httpRequest = Http::timeout(300)->withHeaders([
                    "Authorization" => "Bearer " . env("OPENAI_API_KEY"),
                ]);

                foreach ($request->file("images") as $file) {
                    $httpRequest->attach(
                        "image[]",
                        fopen($file->getPathname(), "r"),
                        $file->getClientOriginalName()
                    );
                }

                $response = $httpRequest->post(
                    "https://api.openai.com/v1/images/edits",
                    [
                        "model" => "gpt-image-1",
                        "prompt" => $prompt,
                        "n" => $n,
                    ]
                );

                if ($response->successful()) {
                    return response($response->body(), 200);
                } else {
                    return response()->json(
                        [
                            "error" => "Failed to fetch response from OpenAI.",
                            "details" => $response->json(),
                        ],
                        $response->status()
                    );
                }
            }
        } catch (Exception $e) {
            return response($e);
        }
    }
}
