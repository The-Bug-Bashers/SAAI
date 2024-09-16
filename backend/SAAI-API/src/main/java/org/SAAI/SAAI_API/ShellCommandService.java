// ShellCommandService.java
package org.SAAI.SAAI_API;

import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.concurrent.CompletableFuture;

@Service
public class ShellCommandService {

    // Asynchronously execute the signal-cli commands
    public CompletableFuture<Void> executeSignalCliReceiveAndSend(String message, String addressToken) {
        return CompletableFuture.runAsync(() -> {
            try {
                // Step 1: Execute signal-cli receive command
                Process receiveProcess = Runtime.getRuntime().exec("signal-cli receive");

                // Capture the output of the receive command (optional)
                BufferedReader receiveReader = new BufferedReader(new InputStreamReader(receiveProcess.getInputStream()));
                String receiveLine;
                while ((receiveLine = receiveReader.readLine()) != null) {
                    System.out.println("Signal-CLI receive output: " + receiveLine);
                }

                // Wait for the receive process to complete
                int receiveExitCode = receiveProcess.waitFor();
                System.out.println("Signal-CLI receive exited with code: " + receiveExitCode);

                // Step 2: Execute signal-cli send command with the provided message and address token
                String sendCommand = String.format("signal-cli send -m \"%s\" -g %s", message, addressToken);
                Process sendProcess = Runtime.getRuntime().exec(sendCommand);

                // Capture the output of the send command (optional)
                BufferedReader sendReader = new BufferedReader(new InputStreamReader(sendProcess.getInputStream()));
                String sendLine;
                while ((sendLine = sendReader.readLine()) != null) {
                    System.out.println("Signal-CLI send output: " + sendLine);
                }

                int sendExitCode = sendProcess.waitFor();
                System.out.println("Signal-CLI send exited with code: " + sendExitCode);

            } catch (Exception e) {
                e.printStackTrace();
            }
        });
    }
}
