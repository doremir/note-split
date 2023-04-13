import Fraction from 'fraction.js';

Math.log2 = Math.log2 || function(x) {
  return Math.log(x) * Math.LOG2E;
};

function is_representable(duration, max_dots = 2) {
  const lognum = Math.log2(duration.n);
  switch (max_dots) {
    case 2: return lognum === Math.round(lognum) || duration.n === 3 || duration.n === 7;
    case 1: return lognum === Math.round(lognum) || duration.n === 3;
    case 0: return lognum === Math.round(lognum);
    default: throw new Error('Unsupported max_dots: ' + max_dots);
  }
}

function split(position, duration, beats, beat_denom = 4, rest = false, max_dots = 2) {
  let measure_duration = new Fraction(beats, beat_denom);
  let measure_position = position.mod(measure_duration);

  // If duration is longer than the measure, only care about the part
  // that fits into this measure
  if (measure_position.add(duration) > measure_duration) {
    duration = measure_duration.sub(measure_position);
  }

  if (duration.n === 0) throw new Error('Zero duration in split!');

  // Special cases

  // Single note at start of bar
  if ((measure_position.n === 0) && is_representable(duration, max_dots)) {
    return duration;
  }

  // Dotted off-beat note that completes a beat
  const ending_position = measure_position.add(duration);
  const ends_on_beat = ending_position.d <= beat_denom;
  if (is_representable(duration, max_dots) && ends_on_beat) {
    return duration;
  }

  let division = new Fraction(1, measure_position.d);
  if (duration >= division) return division;
  do {
    if (max_dots >= 1 && duration.n === 3 && duration.d >= division.d * 2 && (!rest || division.d > beat_denom)) {
      return duration;
    }
    if (max_dots >= 2 && duration.n === 7 && duration.d >= division.d * 4 && (!rest || division.d > beat_denom)) {
      return duration;
    }
    division = division.div(2);
  } while (duration < division);
  return division;
}


function divide(durations, measure_length, beat_length, position = new Fraction(0), rest = false, max_dots = 2) {
  /*
  Divide a list of note durations to fit a 2-divisible meter.
  */

  let beats = measure_length.div(beat_length).valueOf();
  var result = [];
  for (var i = 0; i < durations.length; i++) {
    var d = durations[i];
    let note = [];
    while (d > 0) {
      // const cut = split(position, d, measure_length, beat_length, max_dots);
      const cut = split(position, d, beats, 4, rest, max_dots);
      note.push(cut);
      position = position.add(cut);
      d = d.sub(cut);
    }
    result.push(note);
  }
  return result;
}

export default {
  split,
  divide
};

/*

// Sanity check
// Should produce:
// [[Fraction(1, 4)], [Fraction(1, 4), Fraction(1, 16)], [Fraction(3, 16), Fraction(3, 16)]]

const in_dur = [new Fraction(4, 16), new Fraction(5, 16), new Fraction(6, 16)];
var out_dur = divide(in_dur, new Fraction(1), new Fraction(1, 4));

for (var i = 0; i < in_dur.length; i++) {
    console.log(in_dur[i]);
    for (var j = 0; j < out_dur[i].length; j++) {
        console.log('  ', out_dur[i][j].toString());
    }
}

*/
