# [RSAChat](https://scevenate.com/RSAChat)

I built this when I learned what is javascript. It offered a standalone HTML for RSA encryption.

Unfortunately, a lot have happened since then:
- RSAChat now no longer uses RSA. We use a proper PQC cipher suite now.
- Our app have bloated over x1000 times in size, from universal plain browser javascript to a fragile webview hydrator that only works on x86 windows.
- Also it's no longer standalone, you need a DLL. Our build is still deterministic thanks to thousands of lines of lockfiles.
- We now support unicode and binary files. Without the help of browser, our download button is no longer smart, it just downloads to pwd.
- We have transmission control, supporting packet loss / corruption detection, fragmentation and selective retransmission.
