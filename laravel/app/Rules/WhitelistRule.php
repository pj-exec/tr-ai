<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use App\Models\Whitelist;

class WhitelistRule implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  \Closure(string): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(
        string $attribute,
        mixed $value,
        Closure $fail
    ): void {
        if (!Whitelist::where("email", $value)->exists()) {
            $fail("The :attribute is not whitelisted.");
        }
    }
}
