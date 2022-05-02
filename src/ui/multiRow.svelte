<script lang="ts">
  export let variable: number = 1
  // result = turndownService.turndown(result)
  // return result.replaceAll('<', '\\<').replaceAll(/\*\*([0-9]*)\\\.\*\*/g, '$1.')
</script>

<div class="number">
  <span>
    My number is {variable} !
  </span>
</div>

<style>
  .number {
    color: red;
  }
</style>
