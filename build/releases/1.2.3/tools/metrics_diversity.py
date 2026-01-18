import math
from collections import Counter
from typing import Iterable

def shannon_index(labels: Iterable[str]) -> float:
    counts = Counter(labels)
    n = sum(counts.values())
    if n == 0:
        return 0.0
    return -sum((c/n) * math.log(c/n) for c in counts.values() if c > 0)
