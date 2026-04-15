# [RSAChat](https://scevenate.com/RSAChat)

A static service for manually wrapping secrets by local browser.

This project is poorly named. It does a little bit more than you might think.
- Post quantum cryptography encryption. It's not actually RSA, it's just everyone loves RSA.
- Unicode / arbitrary binary transmission. Upload & download files.
- Comprehensive transmission control, supporting corruption detection, fragmentation, packet loss detection, retransmission request and selective retransmission.

## Future plans

- Paddings to minimise metadata exposure.
- Configurable fragment size.

## Notices

This project has undergone a few major refactors. The releases are obsolete and please don't rely on them.

Please do not report the "I received message from myself before I sent it" issue. The message window is supposed to display in timestamp manner, and for messages with same timestamp (millisecond!) the other's message is displayed before yours.