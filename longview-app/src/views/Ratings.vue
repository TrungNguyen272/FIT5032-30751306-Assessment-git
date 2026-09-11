<script setup>
const props = defineProps({
    average: {
        type: Number,
        default: 0
    },
    count: {
        type: Number,
        default: 0
    },
    userRating: {
        type: Number,
        default: 0
    },
    interactive: {
        type: Boolean,
        default: false
    },

})

const emit = defineEmits(['rate'])

function starClass(starNumber) {
    const value = props.interactive ? props.userRating : Math.round(props.average)
    return starNumber <= value ? 'text-warning' : 'text-secondary'
}
</script>

<template>
    <div class="d-flex align-items-center gap-1">
        <button v-for="star in 5" :key="star" type="button" class="btn btn-sm p-0 border-0 bg-transparent"
            :class="starClass(star)" :disabled="!interactive" :style="interactive ? 'cursor:pointer' : 'cursor:default'"
            :aria-label="`Rate ${star} star${star === 1 ? '' : 's'}`" @click="interactive && emit('rate', star)">
            ★
        </button>
        <span class="small text-muted ms-1">
            {{ average > 0 ? average.toFixed(1) : 'No ratings yet' }}
            <span v-if="count > 0">({{ count }})</span>
        </span>
    </div>
</template>