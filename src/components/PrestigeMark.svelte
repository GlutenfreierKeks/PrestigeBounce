<script lang="ts">
    let {
        size = 28,
        class: className = ""
    } = $props<{
        size?: number;
        class?: string;
    }>();
</script>

<svg
        class={className}
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden="true"
>
    <path d="M20 2.8 37.2 20 20 37.2 2.8 20 20 2.8Z" stroke="currentColor" stroke-width="1.15" opacity=".5"/>
    <path d="M20 7.2 32.8 20 20 32.8 7.2 20 20 7.2Z" fill="currentColor" opacity=".075"/>
    <path d="M11.4 14.6 16.1 18l3.9-5.6 3.9 5.6 4.7-3.4-1.6 9.5H13L11.4 14.6Z" fill="currentColor"/>
    <path d="M13.5 27.6h13" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
    <circle cx="20" cy="31.6" r=".9" fill="currentColor" opacity=".7"/>
</svg>

<style>
  svg {
    display: block;
    flex: none;
  }
</style>
