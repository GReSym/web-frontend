<template>
  <div class="page" style="max-width: var(--w-profile)">
    <section class="section">
      <h1>{{ $t('notFound.title') }}</h1>
      <p class="muted">{{ $t('notFound.text') }}</p>
      <RouterLink :to="{ name: 'home' }">{{ $t('notFound.home') }}</RouterLink>
    </section>
  </div>
</template>
