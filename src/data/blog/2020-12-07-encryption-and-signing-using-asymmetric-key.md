---
title: "Encryption and Signing using asymmetric key"
description: "A walkthrough of using asymmetric keys with openssl to encrypt messages and sign data, showing the difference between encryption and signing workflows."
pubDatetime: 2020-12-07T12:00:00Z
tags:
  - linux
  - notes
  - backend
draft: false
---

Today we talk about encryption and signing using private key and public key. Private key and public key we are using asymmetric key. Normally only you will key the private key, and public key can share with others.

When doing encryption, public key is used for encrypting message. And private key is used for decrypting message. When you are communicating with other party, you have his pubic key. You use his public key to encrypt the message and send to him. He decrypts it using his private key. Same way if he sends message to you. You use your private key to decrypt the message from him.

When doing signing, it's a bit different. Signing usually is used for verifying the information received is not tampered during transmission. Along with the data, sender sends the signature. The signature is the encrypted hash value of the data. Normally the way how it hashed is passed as well. The hash value encrypted by sender's private key, that's the signature. The receiver will hash the data using the same way. And decrypt the signature using sender's public key. And compare the hash value with the calculated one if are the same. Then he know if the data is altered or originally from the sender.

Encryption demo. First we use openssl command to generate a private key and the coresponding public key.

```bash
[jacky@cent8 ~]$ openssl genrsa -out key.pem 2048
Generating RSA private key, 2048 bit long modulus
..........................................................+++
..........................+++
e is 65537 (0x10001)

[jacky@cent8 ~]$ openssl rsa -in key.pem -outform PEM -pubout -out public.pem
writing RSA key
```

Using public key to encrypt a string to a file.

```bash
[jacky@cent8 ~]$ echo "test" | openssl rsautl -encrypt -inkey public.pem -pubin > en.txt
```

Using private key to decrypt the file. You can see the decryption get the original text string back.

```bash
[jacky@cent8 ~]$ openssl rsautl -decrypt -inkey key.pem -in en.txt
test
```

Signing demo. First we hash the data using SHA256. The data is only a string.

```bash
[jacky@cent8 ~]$ echo "test" | openssl dgst -sha256
f2ca1bb6c7e907d06dafe4687e579fce76b37e4e93b7605022da52e6ccc26fd2
```

Encrypt the hash value using private key.

```bash
[jacky@cent8 ~]$ echo "f2ca1bb6c7e907d06dafe4687e579fce76b37e4e93b7605022da52e6ccc26fd2" | openssl rsautl -sign -inkey key.pem -out sign.ssl
```

Once receiver receives the message, he can use public key to decrypt the signature. And verify with the sha256 hash value he calculated.

```bash
[jacky@cent8 ~]$ openssl rsautl -inkey public.pem -pubin -in sign.ssl
f2ca1bb6c7e907d06dafe4687e579fce76b37e4e93b7605022da52e6ccc26fd2
```

That's it.
