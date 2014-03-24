all: sfnt2woff woff2sfnt

sfnt2woff: sfnt2woff.o woff.o woff.h Makefile
	$(CC) $(LDFLAGS) -o $@ $< woff.o -lz

woff2sfnt: woff2sfnt.o woff.o woff.h Makefile
	$(CC) $(LDFLAGS) -o $@ $< woff.o -lz

sfnt2woff.o: sfnt2woff.c woff.h Makefile

woff2sfnt.o: woff2sfnt.c woff.h Makefile

woff.o: woff.c woff.h woff-private.h Makefile

clean:
	$(RM) -r *.o *.dSYM
