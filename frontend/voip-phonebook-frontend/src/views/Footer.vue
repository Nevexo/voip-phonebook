<template>
<!-- Full size footer grey at the bottom of the page -->
<footer class="footer py-10">
    <div class="content has-text-centered">
        <p>
            <strong>VoIP Phonebook</strong> by <a href="https://nevexo.space">Cameron Fleming</a> &copy 2024
        </p>
    </div>
</footer>
</template>

<script setup>

</script>

<style scoped>
/* Stick to the bottom of the page, but not absolute. */
.footer {
    position: relative;
    bottom: 0;
    width: 100%;
    height: 60px;
    background-color: #f9f9f9;
    border-top: 1px solid #eaeaea;
    padding: 20px;
    text-align: center;
}
</style>