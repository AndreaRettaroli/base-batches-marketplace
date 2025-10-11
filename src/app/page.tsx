'use client';'use client';



import { useState, useEffect } from 'react';import { useState, useEffect } from 'react';

import ChatInterface from '@/components/ChatInterface';import ChatInterface from '@/components/ChatInterface';

import { ChatSession } from '@/types';import { ChatSession } from '@/types';



export default function Home() {export default function Home() {

  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);

  const [loading, setLoading] = useState(true);  const [loading, setLoading] = useState(true);



  useEffect(() => {  useEffect(() => {

    createNewSession();    createNewSession();

  }, []);  }, []);



  const createNewSession = async () => {  const createNewSession = async () => {

    try {    try {

      setLoading(true);      setLoading(true);

      const response = await fetch('/api/session', {      const response = await fetch('/api/session', {

        method: 'POST',        method: 'POST',

      });      });

      const data = await response.json();      const data = await response.json();

      setCurrentSession(data.session);      setCurrentSession(data.session);

    } catch (error) {    } catch (error) {

      console.error('Failed to create session:', error);      console.error('Failed to create session:', error);

    } finally {    } finally {

      setLoading(false);      setLoading(false);

    }    }

  };  };



  if (loading) {  if (loading) {

    return (    return (

      <div className="min-h-screen flex items-center justify-center">      <div className="min-h-screen flex items-center justify-center">

        <div className="text-center">        <div className="text-center">

          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>

          <p className="text-gray-600">Loading...</p>          <p className="text-gray-600">Loading...</p>

        </div>        </div>

      </div>      </div>

    );    );

  }  }



  return (  return (

    <div className="min-h-screen bg-gray-50">    <div className="min-h-screen bg-gray-50">

      <header className="bg-white shadow-sm border-b">      <header className="bg-white shadow-sm border-b">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">

          <div className="flex items-center justify-between">          <div className="flex items-center justify-between">

            <h1 className="text-2xl font-bold text-gray-900">            <h1 className="text-2xl font-bold text-gray-900">

              Base Batches Marketplace              Base Batches Marketplace

            </h1>            </h1>

            <button            <button

              onClick={createNewSession}              onClick={createNewSession}

              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"

            >            >

              New Chat              New Chat

            </button>            </button>

          </div>          </div>

          <p className="text-gray-600 mt-1">          <p className="text-gray-600 mt-1">

            Upload product images to get AI-powered analysis and price comparisons            Upload product images to get AI-powered analysis and price comparisons

          </p>          </p>

        </div>        </div>

      </header>      </header>



      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {currentSession && (        {currentSession && (

          <ChatInterface           <ChatInterface 

            session={currentSession}            session={currentSession}

            onSessionUpdate={setCurrentSession}            onSessionUpdate={setCurrentSession}

          />          />

        )}        )}

      </main>      </main>

    </div>    </div>

  );            .

}          </li>
          <li className="tracking-[-.01em]">
            Save and see your changes instantly.
          </li>
        </ol>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read our docs
          </a>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
