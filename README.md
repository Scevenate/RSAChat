# [RSAChat](https://scevenate.com/RSAChat)

A static service for manually wrapping secrets by local browser.

This project is poorly named. It does a little bit more than you might think.
- Post quantum cryptography `ML-KEM-768` encryption. (Then why is it called *RSAChat*? Well, it was RSA in the good old days.)
- Unicode / arbitrary binary transmission. Upload & download files.
- Comprehensive transmission control, supporting corruption detection, fragmentation, packet loss detection, retransmission request and selective retransmission.

[Release](https://github.com/Scevenate/RSAChat/releases/latest) is also available as local embedded HTML single file.

## Future plans

- Paddings to minimise metadata exposure.
- Configurable fragment size.
