package org.SAAI.SAAI_API;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.concurrent.CompletableFuture;

@Service
public class ShellCommandService {

    private static final Logger logger = LoggerFactory.getLogger(ShellCommandService.class);

    // Cron job to execute signal-cli receive at 3:00 AM every day
    @Scheduled(cron = "0 0 3 * * *", zone = "Europe/Berlin")
    public void executeSignalCliReceive() {
        try {
            logger.info("Executing scheduled Signal-CLI receive command...");

            // Execute signal-cli receive command
            Process receiveProcess = Runtime.getRuntime().exec("signal-cli receive -t 2 --ignore-attachments --ignore-stories");

            // Capture the output of the receive command
            BufferedReader receiveReader = new BufferedReader(new InputStreamReader(receiveProcess.getInputStream()));
            String receiveLine;
            while ((receiveLine = receiveReader.readLine()) != null) {
                logger.info("Signal-CLI receive output: " + receiveLine);
            }

            int receiveExitCode = receiveProcess.waitFor();
            logger.info("Signal-CLI receive exited with code: " + receiveExitCode);

        } catch (Exception e) {
            logger.error("Error while executing scheduled signal-cli receive command", e);
        }
    }

    // Updated method to handle both group and individual telephone numbers
    public CompletableFuture<Void> executeSignalCliSend(String message, String addressOrPhoneNumber, boolean isGroup) {
        return CompletableFuture.runAsync(() -> {
            try {
                // Build the send command dynamically based on whether it's a group or individual phone number
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

                // Execute signal-cli send command
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
                logger.error("Error while executing signal-cli send command", e);
            }
        });
    }
}
