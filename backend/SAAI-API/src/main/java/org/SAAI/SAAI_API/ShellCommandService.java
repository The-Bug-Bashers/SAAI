package org.SAAI.SAAI_API;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.concurrent.CompletableFuture;

@Service
public class ShellCommandService {

    private static final Logger logger = LoggerFactory.getLogger(ShellCommandService.class);

    // Modified method to handle both group and individual telephone numbers
    public CompletableFuture<Void> executeSignalCliReceiveAndSend(String message, String addressOrPhoneNumber, boolean isGroup) {
        return CompletableFuture.runAsync(() -> {
            try {
                // Step 1: Execute signal-cli receive command
                Process receiveProcess = Runtime.getRuntime().exec("signal-cli receive -t 2 --ignore-attachments --ignore-stories");

                // Capture the output of the receive command
                BufferedReader receiveReader = new BufferedReader(new InputStreamReader(receiveProcess.getInputStream()));
                String receiveLine;
                while ((receiveLine = receiveReader.readLine()) != null) {
                    logger.info("Signal-CLI receive output: " + receiveLine);
                }

                int receiveExitCode = receiveProcess.waitFor();
                logger.info("Signal-CLI receive exited with code: " + receiveExitCode);

                // Step 2: Build the send command dynamically based on whether it's a group or individual phone number
                String[] sendCommand;
                if (isGroup) {
                    sendCommand = new String[]{
                            "signal-cli",
                            "send",
                            "-m", message,
                            "-g", addressOrPhoneNumber
                    };
                } else {
                    sendCommand = new String[]{
                            "signal-cli",
                            "send",
                            "-m", message,
                            "-u", addressOrPhoneNumber
                    };
                }

                logger.info("Executing Signal-CLI send command: " + String.join(" ", sendCommand));

                // Step 3: Execute signal-cli send command
                Process sendProcess = Runtime.getRuntime().exec(sendCommand);

                // Capture the output of the send command
                BufferedReader sendReader = new BufferedReader(new InputStreamReader(sendProcess.getInputStream()));
                String sendLine;
                while ((sendLine = sendReader.readLine()) != null) {
                    logger.info("Signal-CLI send output: " + sendLine);
                }

                int sendExitCode = sendProcess.waitFor();
                logger.info("Signal-CLI send exited with code: " + sendExitCode);

            } catch (Exception e) {
                logger.error("Error while executing signal-cli commands", e);
            }
        });
    }
}
