package de.wayshare.saai.util;

import java.util.stream.Stream;

public final class TestValues {
    private TestValues() {
    }

    public static Stream<String> stringTestValues() {
        String jsonSimple = "{\"name\":\"Alice\",\"age\":30}";
        String jsonNested = "{\"user\":{\"id\":123,\"roles\":[\"admin\",\"user\"]},\"active\":true}";
        String jsonArray = "[{\"id\":1,\"value\":\"A\"},{\"id\":2,\"value\":\"B\"}]";
        String jsonEmpty = "{}";
        String jsonSpecialChars = "{\"text\":\"Hello \\\"World\\\"! \\n New line.\"}";

        String textSimple = "Hello World";
        String textMultiline = "Line1\nLine2\nLine3";
        String textSpecialChars = "ßäöü!@#$%^&*()_+-=[]{};:'\",.<>/?\\|";

        String formSimple = "key1=value1&key2=value2";
        String formWithSpecialChars = "name=Alice+%26+Bob&city=Berlin%2C+Germany";

        String whitespaceOnly = "   \n\t  ";
        String veryLargeBody = "A".repeat(100000); // 100k characters

        return Stream.of(
                jsonSimple,
                jsonNested,
                jsonArray,
                jsonEmpty,
                jsonSpecialChars,
                textSimple,
                textMultiline,
                textSpecialChars,
                formSimple,
                formWithSpecialChars,
                whitespaceOnly,
                veryLargeBody
        );
    }

}
