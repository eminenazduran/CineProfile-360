export default function Home() {
  return (
    <section className="space-y-6">
      <h1 className="text-4xl font-extrabold text-blue-500">Hoş geldin 👋</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1,2,3,4,5,6].map((i) => (
          <article key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <div className="aspect-video bg-gray-800 rounded-xl mb-3" />
            <h3 className="font-semibold">Sahte Film {i}</h3>
            <p className="text-sm text-gray-400">Kısa açıklama • Tür • 2024</p>
          </article>
        ))}
      </div>
    </section>
  )
}
