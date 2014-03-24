/* -*- Mode: C; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*-
 * ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is WOFF font packaging code.
 *
 * The Initial Developer of the Original Code is Mozilla Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Jonathan Kew <jfkthame@gmail.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#include "woff.h"

static void
die(const char * msg)
{
  fprintf(stderr, "# fatal error: %s\n", msg);
  exit(2);
}

static void
reportErr(uint32_t status)
{
  woffPrintStatus(stderr, status, "### ");
  exit(2);
}

static void
usage(const char * progName)
{
  fprintf(stderr, "Usage:\n"
                  "  %s [-v <maj>.<min>] [-m <metadata.xml>] [-p <private.dat>] <otffile>\n"
                  "    package OpenType <otffile> as WOFF, creating <otffile>.woff\n"
                  "Options:\n"
                  "    -v <maj>.<min>     set font version number (major and minor, both integers)\n"
                  "    -m <metadata.xml>  include metadata from <metadata.xml> (not validated)\n"
                  "    -p <private.dat>   include private data block\n"
                  , progName);
}

const uint8_t *
readFile(const char * name, uint32_t * len)
{
  FILE * inFile = fopen(name, "rb");
  if (!inFile) {
    char buf[200];
    sprintf(buf, "unable to open file %s", name);
    die(buf);
  }

  if (fseek(inFile, 0, SEEK_END) != 0)
    die("seek failure");
  *len = ftell(inFile);
  if (fseek(inFile, 0, SEEK_SET) != 0)
    die("seek failure");

  uint8_t * data = (uint8_t *) malloc(*len);
  if (!data)
    die("malloc failure");
  if (fread(data, 1, *len, inFile) != *len)
    die("file read failure");
  fclose(inFile);

  return data;
}

int
main(int argc, char * argv[])
{
  const char * progName = argv[0];
  const char * metadataFile = NULL;
  const char * privateFile = NULL;
  unsigned int maj = 0, min = 0;
  uint32_t status = eWOFF_ok;

  int opt;
  while ((opt = getopt(argc, argv, "v:m:p:h")) != -1) {
    switch (opt) {
    case 'v':
      if (sscanf(optarg, "%u.%u", &maj, &min) < 2 || maj > 0xffff || min > 0xffff) {
        fprintf(stderr, "# bad version number, setting to 0.0\n");
        maj = min = 0;
      }
      break;
    case 'm':
      metadataFile = optarg;
      break;
    case 'p':
      privateFile = optarg;
      break;
    case 'h':
    case '?':
      usage(progName);
      exit(0);
    default:
      fprintf(stderr, "# unknown option \"%c\"\n", opt);
      break;
    }
  }
  argc -= optind;
  argv += optind;

  if (argc != 1) {
    usage(progName);
    exit(1);
  }

  uint32_t sfntLen;
  const uint8_t * sfntData = readFile(argv[0], &sfntLen);

  uint32_t woffLen;
  const uint8_t * woffData = woffEncode(sfntData, sfntLen, maj, min, &woffLen, &status);
  free((void *)sfntData);
  if (WOFF_FAILURE(status)) {
    reportErr(status);
  }

  if (metadataFile) {
    uint32_t len;
    const uint8_t * data = readFile(metadataFile, &len);
    woffData = woffSetMetadata(woffData, &woffLen, data, len, &status);
    free((void *)data);
    if (WOFF_FAILURE(status)) {
      reportErr(status);
    }
  }

  if (privateFile) {
    uint32_t len;
    const uint8_t * data = readFile(privateFile, &len);
    woffData = woffSetPrivateData(woffData, &woffLen, data, len, &status);
    free((void *)data);
    if (WOFF_FAILURE(status)) {
      reportErr(status);
    }
  }

  if (WOFF_WARNING(status)) {
    woffPrintStatus(stderr, status, "### ");
  }

  char * outName = (char *) malloc(strlen(argv[0]) + 8);
  if (!outName)
    die("malloc failure");
  strcpy(outName, argv[0]);
  char * ext = strrchr(outName, '.');
  if (ext && (!strcmp(ext, ".ttf") || !strcmp(ext, ".otf")))
    *ext = 0;
  strcat(outName, ".woff");

  if (woffData) {
    FILE * outFile = fopen(outName, "wb");
    free(outName);
    if (!outFile)
      die("unable to open output file");
    if (fwrite(woffData, 1, woffLen, outFile) != woffLen)
      die("file write failure");
    fclose(outFile);
    free((void *) woffData);
  } else {
    die("unable to create WOFF data");
  }

  return 0;
}
