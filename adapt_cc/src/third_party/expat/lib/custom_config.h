/*================================================================
** Copyright 2000, Clark Cooper
** All rights reserved.
**
** This is free software. You are permitted to copy, distribute, or modify
** it under the terms of the MIT/X license (contained in the COPYING file
** with this distribution.)
**
*/

#ifndef CUSTOM_CONFIG_H
#define CUSTOM_CONFIG_H


/* 1234 = LIL_ENDIAN, 4321 = BIGENDIAN */
#define BYTEORDER  1234

/* Define to 1 if you have the `bcopy' function. */
#undef HAVE_BCOPY

/* Define to 1 if you have the `memmove' function. */
#define HAVE_MEMMOVE

/* Define to 1 if you have a working `mmap' system call. */
#undef HAVE_MMAP

/* Define to 1 if you have the <unistd.h> header file. */
#define HAVE_UNISTD_H

/* Define to specify how much context to retain around the current parse
   point. */
#undef XML_CONTEXT_BYTES

/* Define to make parameter entity parsing functionality available. */
#define XML_DTD

/* Define to make XML Namespaces functionality available. */
#define XML_NS

/* Define to `long' if <sys/types.h> does not define. */
#define off_t  ptrdiff_t

/* Define to `unsigned' if <sys/types.h> does not define. */
#undef size_t


#endif /* ifndef CUSTOM_CONFIG_H */
