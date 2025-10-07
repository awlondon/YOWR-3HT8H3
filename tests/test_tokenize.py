from hlsf.tokenize import tokenize


def test_tokenize_basic():
    t = tokenize("Hello, world!")
    assert t == ["Hello", ",", "world", "!"]
