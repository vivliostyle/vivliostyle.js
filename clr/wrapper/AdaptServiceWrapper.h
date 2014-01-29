#pragma once
#include <vcclr.h>
#include <windows.h>

#include "clang/service/adapt_service.h"

using namespace System;
using namespace System::Runtime::InteropServices; // Marshal
using namespace System::IO;
using namespace System::Text;

namespace AdaptServiceWrapper
{
	public delegate void MessageHandler(String^ str);

	struct AdaptCallback {
		adapt_callback callback;
		const char* content;
		HANDLE file;
		HANDLE map;
		gcroot<MessageHandler^> messageHandler;
	};

    inline void __cdecl ReadBytes(adapt_callback* self, void* buffer, size_t offset, size_t length) {
		AdaptCallback* callback = (AdaptCallback*)self;
		memcpy(buffer, callback->content + offset, length);
	}

    inline void __cdecl ProcessMessage(struct adapt_callback* self, const void* buffer, size_t length) {
		AdaptCallback* callback = (AdaptCallback*)self;
		Text::UTF8Encoding^ encoding = gcnew Text::UTF8Encoding();
		String^ message = gcnew String((const char*)buffer, 0, (int)length, encoding);
		callback->messageHandler->Invoke(message);
	}

    public ref class AdaptService
    {
    private:

		AdaptCallback* callback;
        adapt_serving_context* context;

    public:
        AdaptService()
			: callback(NULL), context(NULL)
		{
        }

        ~AdaptService()
		{
			Close();
		}

        bool OpenContainer(String^ fileName, bool zipped, MessageHandler^ messageHandler) 
        {
			Close();
			
			IntPtr fileNamePtr = Marshal::StringToHGlobalUni(fileName);
			HANDLE file = CreateFile( (wchar_t*)(void*)fileNamePtr,
				GENERIC_READ, 0, NULL, OPEN_EXISTING, FILE_FLAG_RANDOM_ACCESS, NULL );
			Marshal::FreeHGlobal(fileNamePtr);
			if (file == INVALID_HANDLE_VALUE)
			{
    			return false;
			}

			DWORD high;
			DWORD size = GetFileSize(file, &high);
			if (size == INVALID_FILE_SIZE || high != 0 || size > 0x7FFFFFFF)
			{
    			CloseHandle(file);
				return false;
			}

			HANDLE map = CreateFileMapping(file, NULL, PAGE_READONLY | SEC_RESERVE, 0, 0, 0);
			if (!map)
			{
    			CloseHandle(file);
    			return false;
			}

			const char* content = (const char*) MapViewOfFile(map, FILE_MAP_READ, 0, 0, 0);
			if (!content)
			{
    			CloseHandle(map);
    			CloseHandle(file);
    			return false;
			}

			callback = new AdaptCallback();
			callback->messageHandler = messageHandler;
			callback->content = content;
			callback->file = file;
			callback->map = map;
			callback->callback.content_length = size;
			callback->callback.packaging_type = zipped ? ADAPT_PACKAGE_ZIP : ADAPT_PACKAGE_SINGLE_FILE;
			callback->callback.base_path = NULL;
			callback->callback.read_bytes = ReadBytes;
			callback->callback.process_message = ProcessMessage;
			context = adapt_start_serving(&callback->callback);
			return context != NULL;
        }

        bool OpenPath(String^ fileName, MessageHandler^ messageHandler) 
        {
			Close();

			IntPtr fileNamePtr = Marshal::StringToHGlobalUni(fileName);
			const wchar_t* fileNameW = (wchar_t*)(void*)fileNamePtr;
			int fileNameLen = 4 * wcslen(fileNameW);
			char* fileNameUTF8 = new char[fileNameLen+1];
			WideCharToMultiByte(CP_UTF8, 0, fileNameW, -1, fileNameUTF8, fileNameLen, 0, 0);
			for (char* s = fileNameUTF8; *s; ++s) {
				if (*s == '\\') {
					*s = '/';
				}
			}
			WIN32_FILE_ATTRIBUTE_DATA info;
			BOOL result = GetFileAttributesExW(fileNameW, GetFileExInfoStandard, &info);
			Marshal::FreeHGlobal(fileNamePtr);
			if (info.nFileSizeHigh != 0)
			{
				delete[] fileNameUTF8;
				return false;
			}

			callback = new AdaptCallback();
			callback->messageHandler = messageHandler;
			callback->content = NULL;
			callback->file = NULL;
			callback->map = NULL;
			callback->callback.content_length = info.nFileSizeLow;
			callback->callback.packaging_type = ADAPT_PACKAGE_FILE_SYSTEM;
			callback->callback.base_path = fileNameUTF8;
			callback->callback.read_bytes = NULL;
			callback->callback.process_message = ProcessMessage;
			context = adapt_start_serving(&callback->callback);
			return context != NULL;
		}

		void Close()
        { 
			if (context)
			{
				adapt_stop_serving(context);
			    context = NULL;
			}
			if (callback) {
				UnmapViewOfFile(callback->content);
    			CloseHandle(callback->map);
    			CloseHandle(callback->file);
				delete callback;
				callback = NULL;
			}
        }

        String^ GetBootstrapURL()
        { 
            const char* url = adapt_get_bootstrap_url(context);
			return gcnew String(url);
        }

        String^ GetInitCall(String^ instanceId, String^ extraParams)
        { 
			IntPtr instanceIdPtr = Marshal::StringToHGlobalAnsi(instanceId);
			IntPtr extraParamPtr = Marshal::StringToHGlobalAnsi(extraParams);
            const char* initCall = adapt_get_init_call(context, 
				(const char*)(void *)instanceIdPtr, (const char*)(void *)extraParamPtr);
			Marshal::FreeHGlobal(instanceIdPtr);
			Marshal::FreeHGlobal(extraParamPtr);
			Text::UTF8Encoding^ encoding = gcnew Text::UTF8Encoding();
			return gcnew String(initCall, 0, strlen(initCall), encoding);
        }
    };
}
