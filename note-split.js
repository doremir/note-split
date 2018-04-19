import math from 'mathjs'

function is_representable(duration) {
    const lognum = math.log(duration.n, 2);
    return lognum == math.round(lognum) || duration.d == 1 || duration.n == 3 || duration.n == 7;
}

function crosses_division(position, duration, division_duration) {
    return (math.floor((position + duration) / division_duration) - math.floor(position / division_duration)) >= division_duration;
}

function largest_representable(position, duration, measure_duration, beat_duration) {
    if (crosses_division(position, duration, beat_duration) && math.mod(position, beat_duration) != 0) {
        // Make sure note does not cross the beat, unless it starts on a whole-beat.
        duration = math.subtract(beat_duration, math.mod(position, beat_duration));
    }
    if (crosses_division(position, duration, measure_duration)) {
        // Make sure note does not cross measure boundary.
        duration = math.subtract(measure_duration, math.mod(position, measure_duration));
    }
    if (is_representable(duration))
        return duration
    else {
        // Floor duration to nearest division smaller than the duration and recurse to ensure it's representable.
        const floor_value = math.fraction(1, math.floor(duration.d / 2));
        const floor_duration = math.multiply(math.floor(math.divide(duration, floor_value)), floor_value);
        return largest_representable(position, floor_duration, measure_duration, beat_duration);
    }
}

function simple_cut(position, duration, measure_duration, beat_duration) {
    // If the duration is a 2-division of the beat and does not cross the beat, return it.
    const cross_measure = crosses_division(position, duration, measure_duration);
    const cross_beat = crosses_division(position, duration, beat_duration);

    var result = null;

    if (math.mod(position, beat_duration) == 0 && duration.n != 5 && duration.n != 7 && !cross_measure && !cross_beat) {
        // On-beat, not dotted and does not cross a beat or measure.
        result = duration;
    } else if (duration.n == 1 && !cross_measure && !cross_beat) {
        // Simple note value, does not cross a beat or measure.
        division = math.fraction(1, math.floor(duration.d / 2));
        if (math.mod(position, division).n < 2 && math.mod(position, division).d == duration.d * 2)
            result = duration;
    } else if (duration.n == 3) {
        // Single dot note value.
        const subdiv_position = math.mod(position, math.fraction(4, duration.d));
        if (subdiv_position.n == 0 || (subdiv_position.d == duration.d && subdiv_position.n == 1)) {
            // Starts at a valid point in its subdivision.
            result = duration;
        }
    } else if (duration.n == 7) {
        // Double dotted note value.
        const subdiv_position = math.mod(position, math.fraction(4, math.floor(duration.d / 2)));
        if (subdiv_position.n == 0 || (subdiv_position.d == duration.d && subdiv_position.n == 1)) {
            // Starts at a valid point in its subdivision.
            result = duration;
        }
    }

    return result;
}

function advanced_cut(position, duration, measure_duration, beat_duration) {
    // The log of the position denominator.
    var logdenom = math.floor(math.log(position.d, 2));

    const measure_denom = measure_duration.d;

    var cut = null;

    // Find largest representable note value in a subdivision larger than duration.
    for (var i = 2; i > 0; i--) {
        logdenom = math.max(measure_denom, logdenom - i)
        const denom = math.pow(2, logdenom);

        // Calculate the available space in the subdivision.
        const closest_larger = math.fraction(math.pow(2, math.floor(math.log(duration.n / duration.d, 2))));
        const division = math.min(math.fraction(1, denom), closest_larger);
        const test_cut = math.subtract(division, math.mod(position, division));
        if (is_representable(test_cut))
            cut = test_cut;
    }

    if (cut == null)
        throw new Exception('Error, unable to parse note duration.');

    return cut;
}

function split(position, duration, measure_duration, beat_duration) {
    /*
    Given a bar position and duration, 
    cut the biggest possible subdivision out and return it.
    */

    var cut = largest_representable(position, duration, measure_duration, beat_duration);

    cut = simple_cut(position, cut, measure_duration, beat_duration);

    if (cut == null)
        cut = advanced_cut(position, duration, measure_duration, beat_duration);

    return cut;
}

function divide(durations, measure_length, beat_length, position = math.fraction(0)) {
    /*
    Divide a list of note durations to fit a 2-divisible meter.
    */

    var result = [];
    for (var i = 0; i < durations.length; i++) {
        var d = durations[i];
        var note = []
        while (d > 0) {
            const cut = split(position, d, measure_length, beat_length)
            note.push(cut);
            position = math.add(position, cut);
            d = math.subtract(d, cut);
        }
        result.push(note)
    }
    return result;
}

export {
    split as Split,
    divide as divide
};



/*

// Sanity check
// Should produce: 
// [[Fraction(1, 4)], [Fraction(1, 4), Fraction(1, 16)], [Fraction(3, 16), Fraction(3, 16)]]

const in_dur = [math.fraction(4, 16), math.fraction(5, 16), math.fraction(6, 16)];
var out_dur = divide(in_dur, math.fraction(1), math.fraction(1, 4));

for (var i = 0; i < in_dur.length; i++) {
    console.log(in_dur[i]);
    for (var j = 0; j < out_dur[i].length; j++) {
        console.log('  ', out_dur[i][j]);
    }
}

*/