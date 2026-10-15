"use client";
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="catalog-page"><a className="brand" href="/">✳ headysports.</a><h1>The archive needs a moment.</h1><p>We couldn’t load this page. Please try again.</p><button className="primary" onClick={reset}>Try again</button></main>}
