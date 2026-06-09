<script setup lang="ts">
definePageMeta({
  middleware: [
    function (to, from) {
      return navigateTo('/dashboard')
    }
  ]
})
</script>
<template>
  <div>Redirecting to dashboard...</div>
</template>
